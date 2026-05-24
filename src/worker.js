const GOOGLE_GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const GOOGLE_NEARBY_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const GOOGLE_TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const MAX_GOOGLE_CIRCLE_RADIUS_METERS = 50000;
const PLACE_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.googleMapsUri',
  'places.websiteUri',
  'places.currentOpeningHours.openNow',
  'places.regularOpeningHours.openNow',
  'places.primaryType',
  'places.primaryTypeDisplayName',
  'places.types',
  'places.businessStatus'
].join(',');

const CARE_SEARCHES = {
  all: {
    label: 'Care resources',
    includedTypes: ['medical_clinic', 'doctor', 'hospital', 'pharmacy'],
    textQueries: ['medical clinic', 'urgent care', 'pharmacy', 'community health center']
  },
  clinics: {
    label: 'Clinics',
    includedTypes: ['medical_clinic', 'doctor', 'medical_center'],
    textQueries: ['medical clinic', 'community health center']
  },
  pharmacies: {
    label: 'Pharmacies',
    includedTypes: ['pharmacy', 'drugstore'],
    textQueries: ['pharmacy']
  },
  urgent: {
    label: 'Urgent care',
    includedTypes: [],
    textQueries: ['urgent care', 'walk in clinic']
  },
  hospitals: {
    label: 'Hospitals',
    includedTypes: ['hospital', 'general_hospital'],
    textQueries: ['hospital']
  },
  mental: {
    label: 'Mental health',
    includedTypes: [],
    textQueries: ['mental health clinic', 'behavioral health clinic', 'community mental health center']
  },
  low_cost: {
    label: 'Low-cost/free care',
    includedTypes: ['medical_clinic'],
    textQueries: ['free clinic', 'community health center', 'FQHC', 'sliding scale clinic', 'low cost clinic']
  }
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/connect/search') {
      return handleConnectSearch(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleConnectSearch(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders()
    });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405);
  }

  if (!env.GOOGLE_MAPS_API_KEY) {
    return jsonResponse({
      configured: false,
      message: 'Live provider search is not configured yet. Add a Google Maps API key to enable nationwide search.'
    });
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse({ error: 'BAD_REQUEST', message: 'Invalid search request.' }, 400);
  }

  try {
    const radiusMiles = normalizeRadiusMiles(payload.radiusMiles);
    const careType = normalizeCareType(payload.careType);
    const location = payload.lat !== undefined && payload.lng !== undefined
      ? normalizeCoordinateLocation(payload)
      : await geocodeLocation(payload.locationQuery, env.GOOGLE_MAPS_API_KEY);

    if (!location) {
      return jsonResponse({
        error: 'LOCATION_NOT_FOUND',
        message: 'We could not find that location. Try entering a ZIP code, city, or full address.'
      }, 404);
    }

    const results = await searchNearbyCare({
      lat: location.lat,
      lng: location.lng,
      radiusMiles,
      careType,
      googleApiKey: env.GOOGLE_MAPS_API_KEY
    });

    return jsonResponse({
      configured: true,
      location,
      radiusMiles,
      careType,
      results
    });
  } catch (error) {
    console.error('Connect search failed', error);
    return jsonResponse({
      error: 'SEARCH_FAILED',
      message: 'We could not search right now. Please try again.'
    }, 502);
  }
}

async function geocodeLocation(input, googleApiKey) {
  const locationQuery = String(input || '').trim();
  if (!locationQuery) return null;

  const params = new URLSearchParams({
    address: locationQuery,
    components: 'country:US',
    key: googleApiKey
  });

  const response = await fetch(`${GOOGLE_GEOCODING_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Google geocoding failed with ${response.status}`);
  }

  const data = await response.json();
  if (data.status !== 'OK' || !data.results?.length) {
    return null;
  }

  const result = data.results[0];
  return {
    label: result.formatted_address,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    source: 'Google Geocoding'
  };
}

async function searchNearbyCare({ lat, lng, radiusMiles, careType, googleApiKey }) {
  const searchConfig = CARE_SEARCHES[careType] || CARE_SEARCHES.all;
  const radiusMeters = milesToMeters(radiusMiles);
  const clampedCircleRadius = Math.min(radiusMeters, MAX_GOOGLE_CIRCLE_RADIUS_METERS);
  const searches = [];

  if (searchConfig.includedTypes.length) {
    searches.push(searchGoogleNearby({
      lat,
      lng,
      radiusMeters: clampedCircleRadius,
      includedTypes: searchConfig.includedTypes,
      googleApiKey,
      careLabel: searchConfig.label
    }));
  }

  for (const query of searchConfig.textQueries) {
    searches.push(searchGoogleText({
      lat,
      lng,
      radiusMiles,
      textQuery: query,
      googleApiKey,
      careLabel: searchConfig.label
    }));
  }

  const settled = await Promise.allSettled(searches);
  const places = settled
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value);

  const byId = new Map();
  for (const place of places) {
    if (!place?.id) continue;
    if (!byId.has(place.id)) {
      byId.set(place.id, place);
    }
  }

  return [...byId.values()]
    .map(place => normalizeGooglePlaceResult(place, { lat, lng }))
    .filter(result => result.distanceMiles <= radiusMiles)
    .sort((first, second) => first.distanceMiles - second.distanceMiles)
    .slice(0, 24);
}

async function searchGoogleNearby({ lat, lng, radiusMeters, includedTypes, googleApiKey, careLabel }) {
  const body = {
    includedTypes,
    maxResultCount: 12,
    rankPreference: 'DISTANCE',
    locationRestriction: {
      circle: {
        center: {
          latitude: lat,
          longitude: lng
        },
        radius: radiusMeters
      }
    }
  };

  const data = await postGooglePlaces(GOOGLE_NEARBY_SEARCH_URL, body, googleApiKey);
  return (data.places || []).map(place => ({ ...place, requestedCareLabel: careLabel }));
}

async function searchGoogleText({ lat, lng, radiusMiles, textQuery, googleApiKey, careLabel }) {
  const body = {
    textQuery,
    pageSize: 10,
    regionCode: 'US',
    locationRestriction: {
      rectangle: buildSearchRectangle(lat, lng, radiusMiles)
    }
  };

  const data = await postGooglePlaces(GOOGLE_TEXT_SEARCH_URL, body, googleApiKey);
  return (data.places || []).map(place => ({
    ...place,
    requestedCareLabel: careLabel,
    requestedQuery: textQuery
  }));
}

async function postGooglePlaces(url, body, googleApiKey) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': googleApiKey,
      'X-Goog-FieldMask': PLACE_FIELD_MASK
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Places failed with ${response.status}: ${errorText}`);
  }

  return response.json();
}

function normalizeGooglePlaceResult(place, origin) {
  const placeLat = place.location?.latitude;
  const placeLng = place.location?.longitude;
  const distanceMiles = Number.isFinite(placeLat) && Number.isFinite(placeLng)
    ? calculateDistanceMiles(origin.lat, origin.lng, placeLat, placeLng)
    : Number.POSITIVE_INFINITY;
  const primaryType = place.primaryType || place.types?.[0] || '';
  const careType = inferCareType(place);
  const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || '';
  const openNow = place.currentOpeningHours?.openNow ?? place.regularOpeningHours?.openNow;
  const hoursText = typeof openNow === 'boolean'
    ? (openNow ? 'Open now' : 'Closed now')
    : 'Call to confirm hours';

  return {
    id: `google-${place.id}`,
    placeId: place.id,
    name: place.displayName?.text || 'Unnamed provider',
    type: careType,
    category: place.primaryTypeDisplayName?.text || readableType(primaryType) || place.requestedCareLabel,
    distanceMiles,
    address: place.formattedAddress || 'Address not available',
    phone,
    website: place.websiteUri || '',
    mapsUrl: place.googleMapsUri || buildGoogleMapsDirectionsUrl({ lat: placeLat, lng: placeLng }),
    directionsUrl: buildGoogleMapsDirectionsUrl({ lat: placeLat, lng: placeLng }),
    hoursText,
    source: 'Google Places',
    disclaimer: 'Call ahead to confirm services, cost, and hours.'
  };
}

function inferCareType(place) {
  const types = new Set(place.types || []);
  const query = String(place.requestedQuery || '').toLowerCase();

  if (types.has('pharmacy') || types.has('drugstore')) return 'Pharmacy';
  if (types.has('hospital') || types.has('general_hospital')) return 'Hospital';
  if (query.includes('urgent') || query.includes('walk in')) return 'Urgent care';
  if (query.includes('mental') || query.includes('behavioral')) return 'Mental health';
  if (query.includes('free') || query.includes('fqhc') || query.includes('sliding') || query.includes('low cost')) return 'Low-cost/free care';
  if (types.has('dentist') || types.has('dental_clinic')) return 'Dental care';
  if (types.has('physiotherapist')) return 'Physiotherapy';

  return place.requestedCareLabel || 'Clinic';
}

function buildGoogleMapsDirectionsUrl(result) {
  if (!Number.isFinite(result.lat) || !Number.isFinite(result.lng)) {
    return 'https://www.google.com/maps';
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${result.lat},${result.lng}`)}&travelmode=driving`;
}

function calculateDistanceMiles(lat1, lng1, lat2, lng2) {
  const earthRadiusMiles = 3958.8;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const firstLat = toRadians(lat1);
  const secondLat = toRadians(lat2);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMiles * c;
}

function buildSearchRectangle(lat, lng, radiusMiles) {
  const latDelta = radiusMiles / 69;
  const lngDelta = radiusMiles / Math.max(1, Math.abs(69 * Math.cos(toRadians(lat))));

  return {
    low: {
      latitude: clampLatitude(lat - latDelta),
      longitude: clampLongitude(lng - lngDelta)
    },
    high: {
      latitude: clampLatitude(lat + latDelta),
      longitude: clampLongitude(lng + lngDelta)
    }
  };
}

function normalizeCoordinateLocation(payload) {
  const lat = Number(payload.lat);
  const lng = Number(payload.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    label: payload.locationLabel || 'your current location',
    lat,
    lng,
    source: 'Browser location'
  };
}

function normalizeRadiusMiles(value) {
  const radius = Number(value);
  return [5, 10, 25, 50].includes(radius) ? radius : 10;
}

function normalizeCareType(value) {
  return CARE_SEARCHES[value] ? value : 'all';
}

function milesToMeters(miles) {
  return miles * 1609.344;
}

function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

function readableType(type) {
  return String(type || '')
    .split('_')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function clampLatitude(value) {
  return Math.max(-90, Math.min(90, value));
}

function clampLongitude(value) {
  if (value < -180) return value + 360;
  if (value > 180) return value - 360;
  return value;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders({ 'Content-Type': 'application/json; charset=utf-8' })
  });
}

function corsHeaders(extraHeaders = {}) {
  return {
    ...extraHeaders,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
