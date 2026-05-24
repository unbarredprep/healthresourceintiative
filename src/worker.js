const CENSUS_GEOCODER_URL = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress';
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const HRSA_HEALTH_CENTERS_URL = 'https://data.hrsa.gov/HDWAPI3_External/api/v1/GetHealthCentersAroundALocation';
const APP_USER_AGENT = 'ClearCare/1.0 (healthresourceintiative; https://github.com/unbarredprep/healthresourceintiative)';
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_RESULTS = 30;

const cache = new Map();
let lastNominatimRequestAt = 0;

const CARE_SEARCHES = {
  all: {
    label: 'Care resource',
    osmFilters: [
      ['amenity', 'pharmacy|hospital|clinic|doctors'],
      ['healthcare', 'clinic|doctor|hospital|pharmacy']
    ],
    includeHrsa: true
  },
  clinics: {
    label: 'Clinic',
    osmFilters: [
      ['amenity', 'clinic|doctors'],
      ['healthcare', 'clinic|doctor']
    ],
    includeHrsa: true
  },
  pharmacies: {
    label: 'Pharmacy',
    osmFilters: [
      ['amenity', 'pharmacy'],
      ['healthcare', 'pharmacy']
    ],
    includeHrsa: false
  },
  urgent: {
    label: 'Urgent care',
    osmFilters: [
      ['amenity', 'clinic|hospital|doctors'],
      ['healthcare', 'clinic|doctor|hospital']
    ],
    includeHrsa: false,
    textTerms: ['urgent', 'walk-in', 'walk in', 'immediate care', 'emergency']
  },
  hospitals: {
    label: 'Hospital',
    osmFilters: [
      ['amenity', 'hospital'],
      ['healthcare', 'hospital']
    ],
    includeHrsa: false
  },
  mental: {
    label: 'Mental health',
    osmFilters: [
      ['amenity', 'clinic|doctors'],
      ['healthcare', 'clinic|doctor|psychotherapist']
    ],
    includeHrsa: false,
    textTerms: ['mental', 'behavioral', 'psychiatry', 'psychiatric', 'psychology', 'counseling', 'counselling', 'therapy', 'therapist', 'psychotherapist']
  },
  low_cost: {
    label: 'Low-cost/free care',
    osmFilters: [
      ['amenity', 'clinic|doctors'],
      ['healthcare', 'clinic|doctor']
    ],
    includeHrsa: true,
    textTerms: ['free', 'community', 'fqhc', 'federally qualified', 'sliding', 'low cost', 'low-cost', 'public health']
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
      : await geocodeLocation(payload.locationQuery, env);

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
      env
    });

    return jsonResponse({
      configured: true,
      location,
      radiusMiles,
      careType,
      attribution: 'Location and provider results may use public data from HRSA and OpenStreetMap contributors.',
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

async function geocodeLocation(input, env) {
  const locationQuery = String(input || '').trim();
  if (!locationQuery) return null;

  const cacheKey = `geocode:${locationQuery.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;

  const censusResult = await geocodeWithCensus(locationQuery).catch(() => null);
  if (censusResult) {
    setCached(cacheKey, censusResult);
    return censusResult;
  }

  const nominatimResult = await geocodeWithNominatim(locationQuery, env).catch(() => null);
  setCached(cacheKey, nominatimResult);
  return nominatimResult;
}

async function geocodeWithCensus(locationQuery) {
  const params = new URLSearchParams({
    address: locationQuery,
    benchmark: 'Public_AR_Current',
    format: 'json'
  });

  const response = await fetch(`${CENSUS_GEOCODER_URL}?${params.toString()}`, {
    headers: {
      'User-Agent': APP_USER_AGENT
    }
  });

  if (!response.ok) {
    throw new Error(`Census geocoder failed with ${response.status}`);
  }

  const data = await response.json();
  const match = data.result?.addressMatches?.[0];
  const coordinates = match?.coordinates;

  if (!coordinates || !Number.isFinite(coordinates.x) || !Number.isFinite(coordinates.y)) {
    return null;
  }

  return {
    label: match.matchedAddress || locationQuery,
    lat: coordinates.y,
    lng: coordinates.x,
    source: 'U.S. Census Geocoder'
  };
}

async function geocodeWithNominatim(locationQuery, env) {
  await throttleNominatim();

  const params = new URLSearchParams({
    q: locationQuery,
    format: 'jsonv2',
    countrycodes: 'us',
    limit: '1',
    addressdetails: '1'
  });

  if (env.NOMINATIM_CONTACT_EMAIL) {
    params.set('email', env.NOMINATIM_CONTACT_EMAIL);
  }

  const response = await fetch(`${NOMINATIM_SEARCH_URL}?${params.toString()}`, {
    headers: {
      'User-Agent': APP_USER_AGENT,
      'Referer': 'https://github.com/unbarredprep/healthresourceintiative'
    }
  });

  if (!response.ok) {
    throw new Error(`Nominatim geocoder failed with ${response.status}`);
  }

  const data = await response.json();
  const match = data[0];
  if (!match) return null;

  const lat = Number(match.lat);
  const lng = Number(match.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    label: match.display_name || locationQuery,
    lat,
    lng,
    source: 'OpenStreetMap Nominatim'
  };
}

async function searchNearbyCare({ lat, lng, radiusMiles, careType, env }) {
  const cacheKey = `search:${lat.toFixed(4)}:${lng.toFixed(4)}:${radiusMiles}:${careType}:${Boolean(env.HRSA_API_TOKEN)}`;
  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;

  const searchConfig = CARE_SEARCHES[careType] || CARE_SEARCHES.all;
  const searches = [
    searchOpenStreetMap({ lat, lng, radiusMiles, careType, searchConfig })
  ];

  if (searchConfig.includeHrsa && env.HRSA_API_TOKEN) {
    searches.push(searchHrsaHealthCenters({ lat, lng, radiusMiles, token: env.HRSA_API_TOKEN }));
  }

  const settled = await Promise.allSettled(searches);
  const results = settled
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value)
    .filter(result => Number.isFinite(result.distanceMiles) && result.distanceMiles <= radiusMiles);

  const uniqueResults = dedupeResults(results)
    .sort((first, second) => first.distanceMiles - second.distanceMiles)
    .slice(0, MAX_RESULTS);

  setCached(cacheKey, uniqueResults);
  return uniqueResults;
}

async function searchOpenStreetMap({ lat, lng, radiusMiles, careType, searchConfig }) {
  const radiusMeters = milesToMeters(radiusMiles);
  const query = buildOverpassQuery({ lat, lng, radiusMeters, filters: searchConfig.osmFilters });

  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': APP_USER_AGENT
    },
    body: new URLSearchParams({ data: query }).toString()
  });

  if (!response.ok) {
    throw new Error(`Overpass failed with ${response.status}`);
  }

  const data = await response.json();
  return (data.elements || [])
    .map(element => normalizeOsmElement(element, { lat, lng }, searchConfig.label))
    .filter(result => result && matchesCareType(result, careType, searchConfig));
}

async function searchHrsaHealthCenters({ lat, lng, radiusMiles, token }) {
  const response = await fetch(HRSA_HEALTH_CENTERS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': APP_USER_AGENT
    },
    body: JSON.stringify({
      Latitude: lat,
      Longitude: lng,
      Radius: radiusMiles,
      MinRecs: 0,
      MaxRadius: radiusMiles,
      Token: token
    })
  });

  if (!response.ok) {
    throw new Error(`HRSA failed with ${response.status}`);
  }

  const data = await response.json();
  return (data.HCC || []).map(site => normalizeHrsaHealthCenter(site, { lat, lng })).filter(Boolean);
}

function buildOverpassQuery({ lat, lng, radiusMeters, filters }) {
  const queryParts = [];
  for (const [key, values] of filters) {
    for (const osmType of ['node', 'way', 'relation']) {
      queryParts.push(`${osmType}["${key}"~"^(${values})$",i](around:${radiusMeters},${lat},${lng});`);
    }
  }

  return `
    [out:json][timeout:25];
    (
      ${queryParts.join('\n      ')}
    );
    out center tags ${MAX_RESULTS * 3};
  `;
}

function normalizeOsmElement(element, origin, fallbackType) {
  const tags = element.tags || {};
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const name = firstNonEmpty(tags.name, tags['official_name'], tags.operator, fallbackType);
  const address = buildOsmAddress(tags);
  const phone = firstNonEmpty(tags.phone, tags['contact:phone'], tags['contact:mobile']);
  const website = normalizeWebsite(firstNonEmpty(tags.website, tags['contact:website'], tags.url));
  const type = inferOsmCareType(tags, fallbackType);
  const distanceMiles = calculateDistanceMiles(origin.lat, origin.lng, lat, lng);

  return {
    id: `osm-${element.type}-${element.id}`,
    name,
    type,
    category: readableType(firstNonEmpty(tags.healthcare, tags.amenity, type)),
    distanceMiles,
    address: address || 'Address not available',
    phone,
    website,
    mapsUrl: buildMapSearchUrl({ lat, lng, address }),
    directionsUrl: buildGoogleMapsDirectionsUrl({ lat, lng, address }),
    hoursText: tags.opening_hours ? `Hours listed: ${tags.opening_hours}` : 'Call to confirm hours',
    source: 'OpenStreetMap',
    disclaimer: 'Call ahead to confirm services, cost, and hours.',
    searchText: Object.values(tags).join(' ').toLowerCase()
  };
}

function normalizeHrsaHealthCenter(site, origin) {
  const [lat, lng] = parseHrsaLatLon(site.LAT_LON);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const address = [site.SITE_ADDRESS, site.SITE_CITY, site.SITE_STATE_ABBR, site.SITE_ZIP_CD]
    .filter(Boolean)
    .join(', ');
  const distanceMiles = Number(site.Distance) || calculateDistanceMiles(origin.lat, origin.lng, lat, lng);

  return {
    id: `hrsa-${site.HCC_FCT_ID || site.Row_ID || `${lat}-${lng}`}`,
    name: firstNonEmpty(site.SITE_NM, 'HRSA Health Center'),
    type: 'Low-cost/free care',
    category: firstNonEmpty(site.HCC_TYP_DESC, 'Health center'),
    distanceMiles,
    address: address || 'Address not available',
    phone: firstNonEmpty(site.SITE_PHONE_NUM),
    website: normalizeWebsite(firstNonEmpty(site.SITE_URL)),
    mapsUrl: buildMapSearchUrl({ lat, lng, address }),
    directionsUrl: buildGoogleMapsDirectionsUrl({ lat, lng, address }),
    hoursText: 'Call to confirm hours',
    source: 'HRSA Health Center Data',
    disclaimer: 'Call ahead to confirm services, cost, and hours.'
  };
}

function matchesCareType(result, careType, searchConfig) {
  if (!searchConfig.textTerms?.length) return true;

  const haystack = `${result.name} ${result.category} ${result.type} ${result.address} ${result.searchText || ''}`.toLowerCase();
  return searchConfig.textTerms.some(term => haystack.includes(term));
}

function inferOsmCareType(tags, fallbackType) {
  const amenity = String(tags.amenity || '').toLowerCase();
  const healthcare = String(tags.healthcare || '').toLowerCase();
  const haystack = Object.values(tags).join(' ').toLowerCase();

  if (amenity === 'pharmacy' || healthcare === 'pharmacy') return 'Pharmacy';
  if (amenity === 'hospital' || healthcare === 'hospital') return 'Hospital';
  if (haystack.includes('urgent') || haystack.includes('walk-in') || haystack.includes('walk in')) return 'Urgent care';
  if (haystack.includes('mental') || haystack.includes('behavioral') || healthcare === 'psychotherapist') return 'Mental health';
  if (haystack.includes('free') || haystack.includes('fqhc') || haystack.includes('low cost') || haystack.includes('sliding')) return 'Low-cost/free care';
  if (amenity === 'doctors' || healthcare === 'doctor') return 'Doctor';
  if (amenity === 'clinic' || healthcare === 'clinic') return 'Clinic';

  return fallbackType || 'Care resource';
}

function buildOsmAddress(tags) {
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const city = firstNonEmpty(tags['addr:city'], tags['addr:town'], tags['addr:village']);
  const state = tags['addr:state'];
  const postcode = tags['addr:postcode'];

  return [street, city, state, postcode].filter(Boolean).join(', ');
}

function dedupeResults(results) {
  const byKey = new Map();
  for (const result of results) {
    const key = `${normalizeKey(result.name)}|${normalizeKey(result.address)}`;
    const existing = byKey.get(key);
    if (!existing || sourceRank(result.source) > sourceRank(existing.source)) {
      byKey.set(key, result);
    }
  }

  return [...byKey.values()];
}

function sourceRank(source) {
  if (source === 'HRSA Health Center Data') return 2;
  if (source === 'OpenStreetMap') return 1;
  return 0;
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
  return [5, 10, 25, 50].includes(radius) ? radius : 25;
}

function normalizeCareType(value) {
  return CARE_SEARCHES[value] ? value : 'all';
}

function parseHrsaLatLon(value) {
  const parts = String(value || '').trim().split(/\s+/).map(Number);
  return [parts[0], parts[1]];
}

function buildGoogleMapsDirectionsUrl(result) {
  if (Number.isFinite(result.lat) && Number.isFinite(result.lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${result.lat},${result.lng}`)}&travelmode=driving`;
  }

  if (result.address) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(result.address)}&travelmode=driving`;
  }

  return 'https://www.google.com/maps';
}

function buildMapSearchUrl(result) {
  if (Number.isFinite(result.lat) && Number.isFinite(result.lng)) {
    return `https://www.openstreetmap.org/?mlat=${result.lat}&mlon=${result.lng}#map=16/${result.lat}/${result.lng}`;
  }

  if (result.address) {
    return `https://www.openstreetmap.org/search?query=${encodeURIComponent(result.address)}`;
  }

  return 'https://www.openstreetmap.org';
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

function milesToMeters(miles) {
  return Math.round(miles * 1609.344);
}

function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

function readableType(type) {
  return String(type || '')
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function firstNonEmpty(...values) {
  return values.find(value => typeof value === 'string' && value.trim())?.trim() || '';
}

function normalizeWebsite(value) {
  const website = String(value || '').trim();
  if (!website || website === '[No Data]') return '';
  if (/^https?:\/\//i.test(website)) return website;
  return `https://${website}`;
}

function normalizeKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

async function throttleNominatim() {
  const elapsed = Date.now() - lastNominatimRequestAt;
  if (elapsed < 1100) {
    await new Promise(resolve => setTimeout(resolve, 1100 - elapsed));
  }

  lastNominatimRequestAt = Date.now();
}

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }

  return entry.value;
}

function setCached(key, value) {
  cache.set(key, {
    createdAt: Date.now(),
    value
  });
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
