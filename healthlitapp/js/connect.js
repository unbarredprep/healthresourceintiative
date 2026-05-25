/* ============================================================
   CLEARCARE — CONNECT PAGE JS
   Direct calls to HRSA (free, no key) + Google Places API
   Everything else preserved from original partner code
   ============================================================ */

const SAVED_STORAGE_KEY = 'clearcare_saved_resources';

const DEFAULT_FILTERS = {
  careType: 'all',
  distance: 25
};

const state = {
  filters: { ...DEFAULT_FILTERS },
  currentSearch: null,
  latestResults: [],
  savedResources: loadSavedResources(),
  activeController: null
};

let elements = {};

document.addEventListener('DOMContentLoaded', () => {
  elements = {
    form:                document.getElementById('connectSearchForm'),
    input:               document.getElementById('locationInput'),
    useLocationButton:   document.getElementById('useLocationButton'),
    resetFiltersButton:  document.getElementById('resetFiltersButton'),
    resultsArea:         document.getElementById('resultsArea'),
    resultsSummary:      document.getElementById('resultsSummary'),
    savedCareOptions:    document.getElementById('savedCareOptions'),
    locationMessage:     document.getElementById('locationMessage')
  };

  elements.form.addEventListener('submit', handleSearchSubmit);
  elements.useLocationButton.addEventListener('click', handleUseLocation);
  elements.resetFiltersButton.addEventListener('click', resetFilters);
  elements.resultsArea.addEventListener('click', handleResultAction);
  elements.savedCareOptions.addEventListener('click', handleSavedAction);

  document.querySelectorAll('.filter-pill[data-filter]').forEach(button => {
    button.addEventListener('click', () => updateFilter(button));
  });

  renderInitialState();
  renderSavedCare();
});

function handleSearchSubmit(event) {
  event.preventDefault();
  clearMessage();

  const locationQuery = elements.input.value.trim();
  if (!locationQuery) {
    elements.input.focus();
    elements.input.setAttribute('aria-invalid', 'true');
    showMessage('Enter a ZIP code, city, or full address to search nearby care.', 'error');
    return;
  }

  elements.input.removeAttribute('aria-invalid');
  state.currentSearch = { locationQuery };
  performSearch();
}

function handleUseLocation() {
  clearMessage();

  if (!('geolocation' in navigator)) {
    showGeolocationDenied();
    renderGeolocationDenied();
    return;
  }

  setLocationButtonLoading(true);
  renderLoading();
  showMessage('Asking your browser for your location...', 'info');

  navigator.geolocation.getCurrentPosition(
    position => {
      state.currentSearch = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        locationLabel: 'your current location'
      };
      elements.input.value = 'Current location';
      setLocationButtonLoading(false);
      showMessage(getLocationSuccessMessage(position.coords.accuracy), 'success');
      performSearch();
    },
    () => {
      setLocationButtonLoading(false);
      showGeolocationDenied();
      renderGeolocationDenied();
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 }
  );
}

async function performSearch() {
  if (!state.currentSearch) { renderInitialState(); return; }

  if (state.activeController) state.activeController.abort();
  state.activeController = new AbortController();

  renderLoading();

  try {
    const results = await searchNearbyCare({
      ...state.currentSearch,
      radiusMiles: state.filters.distance,
      careType:    state.filters.careType,
      signal:      state.activeController.signal
    });

    state.latestResults = results;
    renderResults({ results, location: { label: state.currentSearch.locationLabel || state.currentSearch.locationQuery } });

  } catch (error) {
    if (error.name === 'AbortError') return;
    if (error.code === 'LOCATION_NOT_FOUND') { renderLocationNotFound(); return; }
    renderError('We could not search right now. Please try again.');
  } finally {
    state.activeController = null;
  }
}

/* ============================================================
   SEARCH — replaces the /api/connect/search backend call
   Uses HRSA (free, no key) + Google Places API
   ============================================================ */
async function searchNearbyCare({ locationQuery, lat, lng, locationLabel, radiusMiles, careType, signal }) {

  // Step 1: If we have a text query, geocode it to lat/lng
  if (locationQuery && (!lat || !lng)) {
    const coords = await geocodeLocation(locationQuery, signal);
    if (!coords) {
      const error = new Error('Location not found');
      error.code  = 'LOCATION_NOT_FOUND';
      throw error;
    }
    lat = coords.lat;
    lng = coords.lng;
  }

  const radiusMeters = Math.round((radiusMiles || 25) * 1609.344);

  // Step 2: Fetch HRSA + Places in parallel
  const [hrsaResults, placesResults] = await Promise.allSettled([
    fetchHRSAClinics(lat, lng, radiusMiles, careType, signal),
    fetchGooglePlaces(lat, lng, radiusMeters, careType, signal)
  ]);

  const combined = [
    ...(hrsaResults.status  === 'fulfilled' ? hrsaResults.value  : []),
    ...(placesResults.status === 'fulfilled' ? placesResults.value : [])
  ];

  // Sort by distance
  combined.sort((a, b) => (a.distanceMiles || 999) - (b.distanceMiles || 999));

  return combined;
}

/* ── Geocode a text address using Google Geocoding API ── */
async function geocodeLocation(query, signal) {
  const placesKey = window.CONFIG?.PLACES_KEY;
  if (!placesKey) {
    // Fallback: try a free geocoder
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, { signal });
      const data = await res.json();
      if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch { return null; }
    return null;
  }

  try {
    const res  = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${placesKey}`,
      { signal }
    );
    const data = await res.json();
    if (data.results?.[0]) {
      const loc = data.results[0].geometry.location;
      return { lat: loc.lat, lng: loc.lng };
    }
  } catch { return null; }
  return null;
}

/* ── HRSA: Federally Qualified Health Centers (free, no key) ── */
async function fetchHRSAClinics(lat, lng, radiusMiles, careType, signal) {
  if (careType && careType !== 'all' && careType !== 'fqhc' && careType !== 'free') return [];

  try {
    const res  = await fetch(
      `https://findahealthcenter.hrsa.gov/api/search?latitude=${lat}&longitude=${lng}&radius=${radiusMiles || 25}&pageSize=8`,
      { signal }
    );
    const data = await res.json();

    return (data.results || []).map((c, i) => ({
      id:           `hrsa-${c.objectId || i}`,
      name:         c.site_name || c.health_center_name || 'Community Health Center',
      type:         'FQHC / Free Clinic',
      category:     'Federally Qualified Health Center',
      address:      [c.site_address, c.site_city, c.site_state_abbreviation, c.site_postal_code].filter(Boolean).join(', '),
      phone:        c.site_phone || '',
      hoursText:    c.hours_of_operation || 'Call for hours',
      distanceMiles: haversineDistance(lat, lng, parseFloat(c.latitude), parseFloat(c.longitude)),
      lat:          parseFloat(c.latitude),
      lng:          parseFloat(c.longitude),
      source:       'HRSA',
      disclaimer:   'Services and hours subject to change. Call ahead to confirm.',
    }));
  } catch {
    return [];
  }
}

/* ── Google Places: urgent care, clinics, pharmacies ── */
async function fetchGooglePlaces(lat, lng, radiusMeters, careType, signal) {
  const placesKey = window.CONFIG?.PLACES_KEY;
  if (!placesKey) return []; // skip if no key

  const typeMap = {
    urgent:   'urgent_care',
    pharmacy: 'pharmacy',
    hospital: 'hospital',
    all:      'health'
  };
  const placeType = typeMap[careType] || 'health';
  const keyword   = careType === 'mental' ? 'mental health clinic' : 'community health clinic';

  try {
    const res  = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusMeters}&type=${placeType}&keyword=${encodeURIComponent(keyword)}&key=${placesKey}`,
      { signal }
    );
    const data = await res.json();

    return (data.results || []).slice(0, 6).map((p, i) => ({
      id:           `places-${p.place_id || i}`,
      name:         p.name,
      type:         formatPlaceType(p.types),
      category:     formatPlaceType(p.types),
      address:      p.vicinity || 'Address unavailable',
      phone:        '',
      hoursText:    p.opening_hours?.open_now === true  ? 'Open now'
                  : p.opening_hours?.open_now === false ? 'Closed now'
                  : 'Call for hours',
      distanceMiles: haversineDistance(lat, lng, p.geometry.location.lat, p.geometry.location.lng),
      lat:          p.geometry.location.lat,
      lng:          p.geometry.location.lng,
      mapsUrl:      `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
      source:       'Google Places',
      disclaimer:   'Call ahead to confirm services, cost, and hours.',
    }));
  } catch {
    return [];
  }
}

function formatPlaceType(types = []) {
  if (types.includes('pharmacy'))    return 'Pharmacy';
  if (types.includes('hospital'))    return 'Hospital';
  if (types.includes('doctor'))      return 'Medical Office';
  if (types.includes('health'))      return 'Health Clinic';
  return 'Care Resource';
}

/* ── Haversine distance formula ── */
function haversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat2 || !lon2) return null;
  const R    = 3958.8; // miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    = Math.sin(dLat/2) ** 2
             + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1));
}

/* ============================================================
   All rendering + UI functions below are unchanged from
   your partner's original code
   ============================================================ */

function updateFilter(button) {
  const filterName = button.dataset.filter;
  const rawValue   = button.dataset.value;
  state.filters[filterName] = filterName === 'distance' ? Number(rawValue) : rawValue;
  updateFilterButtons(filterName, rawValue);
  if (state.currentSearch) performSearch();
}

function resetFilters() {
  state.filters = { ...DEFAULT_FILTERS };
  updateAllFilterButtons();
  if (state.currentSearch) performSearch();
  else renderInitialState();
}

function updateAllFilterButtons() {
  Object.entries(state.filters).forEach(([filterName, value]) => {
    updateFilterButtons(filterName, String(value));
  });
}

function updateFilterButtons(filterName, activeValue) {
  document.querySelectorAll(`.filter-pill[data-filter="${filterName}"]`).forEach(button => {
    const isActive = button.dataset.value === activeValue;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function renderInitialState() {
  state.latestResults = [];
  elements.resultsSummary.textContent = '';
  elements.resultsArea.innerHTML = `
    <div class="connect-state" role="status">
      <strong>Enter a ZIP code, city, or full address to find nearby care options.</strong>
      <p>You can also use your browser location. Results come from public datasets and may be incomplete.</p>
    </div>
  `;
  translateConnectElement(elements.resultsArea);
}

function renderLoading() {
  elements.resultsSummary.textContent = '';
  elements.resultsArea.innerHTML = `
    <div class="connect-state" role="status">
      <div class="connect-spinner" aria-hidden="true"></div>
      <strong>Searching nearby care options...</strong>
    </div>
  `;
  translateConnectElement(elements.resultsArea);
}

function renderResults(data) {
  const resultWord    = state.latestResults.length === 1 ? 'result' : 'results';
  const locationLabel = data.location?.label || state.currentSearch?.locationLabel || 'your search';
  elements.resultsSummary.textContent = `${state.latestResults.length} ${resultWord} near ${locationLabel}`;
  if (!state.latestResults.length) { renderNoResults(); return; }
  elements.resultsArea.innerHTML = state.latestResults.map(renderResourceCard).join('');
  translateConnectElement(elements.resultsSummary);
  translateConnectElement(elements.resultsArea);
}

function renderNoResults() {
  elements.resultsSummary.textContent = '';
  elements.resultsArea.innerHTML = `
    <div class="connect-state" role="status">
      <strong>No results found nearby. Try increasing the distance or changing filters.</strong>
    </div>
  `;
  translateConnectElement(elements.resultsArea);
}

function renderLocationNotFound() {
  state.latestResults = [];
  elements.resultsSummary.textContent = '';
  elements.resultsArea.innerHTML = `
    <div class="connect-state connect-state-error" role="alert">
      <strong>We could not find that location. Try entering a ZIP code, city, or full address.</strong>
    </div>
  `;
  translateConnectElement(elements.resultsArea);
}

function renderError(message) {
  state.latestResults = [];
  elements.resultsSummary.textContent = '';
  elements.resultsArea.innerHTML = `
    <div class="connect-state connect-state-error" role="alert">
      <strong>${escapeHTML(message)}</strong>
    </div>
  `;
  translateConnectElement(elements.resultsArea);
}

function renderGeolocationDenied() {
  state.latestResults = [];
  elements.resultsSummary.textContent = '';
  elements.resultsArea.innerHTML = `
    <div class="connect-state connect-state-error" role="alert">
      <strong>We could not access your location. You can still search by ZIP code, city, or address.</strong>
    </div>
  `;
  translateConnectElement(elements.resultsArea);
}

function renderResourceCard(resource) {
  const isSaved        = state.savedResources.has(resource.id);
  const directionsUrl  = resource.directionsUrl || resource.mapsUrl || buildGoogleMapsDirectionsUrl(resource);
  const phoneMarkup    = resource.phone
    ? `<a class="btn btn-outline" href="${createTelUrl(resource.phone)}">Call ${escapeHTML(resource.phone)}</a>`
    : '<span class="connect-action-note">Phone not listed</span>';
  const websiteMarkup  = resource.website
    ? `<a class="btn btn-outline" href="${escapeAttribute(resource.website)}" target="_blank" rel="noopener noreferrer">Website</a>`
    : '';

  return `
    <article class="clinic-card connect-resource-card">
      <div class="clinic-dot ${getDotClass(resource.type)}" aria-hidden="true"></div>
      <div class="connect-resource-main">
        <div class="connect-resource-topline">
          <div>
            <h3 class="clinic-name" data-no-translate>${escapeHTML(resource.name)}</h3>
            <div class="connect-resource-location" data-no-translate>${escapeHTML(resource.category || resource.type || 'Care resource')}</div>
          </div>
          <span class="connect-distance" data-no-translate>${formatDistance(resource.distanceMiles)}</span>
        </div>
        <div class="clinic-chips">
          <span class="chip connect-type-chip" data-no-translate>${escapeHTML(resource.type || 'Care resource')}</span>
          <span class="chip connect-source-chip" data-no-translate>${escapeHTML(resource.source || 'Provider search')}</span>
        </div>
        <div class="connect-resource-details">
          <div><strong>Address:</strong> <span data-no-translate>${escapeHTML(resource.address || 'Address not available')}</span></div>
          <div><strong>Hours:</strong> <span data-no-translate>${escapeHTML(resource.hoursText || 'Call to confirm hours')}</span></div>
        </div>
        <div class="connect-resource-actions">
          ${phoneMarkup}
          <a class="btn btn-outline" href="${escapeAttribute(directionsUrl)}" target="_blank" rel="noopener noreferrer">Directions</a>
          ${websiteMarkup}
          <button class="btn ${isSaved ? 'btn-outline' : 'btn-primary'}" type="button" data-save-id="${escapeAttribute(resource.id)}">
            ${isSaved ? 'Saved' : 'Save'}
          </button>
        </div>
        <p class="connect-card-disclaimer">${escapeHTML(resource.disclaimer || 'Call ahead to confirm services, cost, and hours.')}</p>
      </div>
    </article>
  `;
}

function handleResultAction(event) {
  const saveButton = event.target.closest('[data-save-id]');
  if (!saveButton) return;
  const resource = state.latestResults.find(item => item.id === saveButton.dataset.saveId);
  if (!resource) return;
  if (state.savedResources.has(resource.id)) removeSavedResource(resource.id);
  else saveResource(resource);
}

function handleSavedAction(event) {
  const removeButton = event.target.closest('[data-remove-saved]');
  if (!removeButton) return;
  removeSavedResource(removeButton.dataset.removeSaved);
}

function saveResource(resource) {
  state.savedResources.set(resource.id, {
    id: resource.id, name: resource.name, type: resource.type,
    category: resource.category, address: resource.address, phone: resource.phone,
    website: resource.website, directionsUrl: resource.directionsUrl,
    mapsUrl: resource.mapsUrl, hoursText: resource.hoursText,
    source: resource.source, disclaimer: resource.disclaimer
  });
  persistSavedResources();
  renderSavedCare();
  rerenderCurrentCards();
}

function removeSavedResource(id) {
  state.savedResources.delete(id);
  persistSavedResources();
  renderSavedCare();
  rerenderCurrentCards();
}

function rerenderCurrentCards() {
  if (!state.latestResults.length) return;
  const setupState = elements.resultsArea.querySelector('.connect-setup-state');
  elements.resultsArea.innerHTML = setupState
    ? `${setupState.outerHTML}${state.latestResults.map(renderResourceCard).join('')}`
    : state.latestResults.map(renderResourceCard).join('');
  translateConnectElement(elements.resultsArea);
}

function renderSavedCare() {
  const savedResources = [...state.savedResources.values()];
  if (!savedResources.length) {
    elements.savedCareOptions.innerHTML = '<p class="connect-empty-small">Save resources you may want to call later.</p>';
    translateConnectElement(elements.savedCareOptions);
    return;
  }
  elements.savedCareOptions.innerHTML = savedResources.map(resource => `
    <div class="connect-saved-item">
      <div>
        <strong data-no-translate>${escapeHTML(resource.name)}</strong>
        <span data-no-translate>${escapeHTML(resource.type || 'Care resource')} - ${escapeHTML(resource.phone || 'Phone not listed')}</span>
      </div>
      <button type="button" class="connect-remove-saved" data-remove-saved="${escapeAttribute(resource.id)}"
        aria-label="Remove ${escapeAttribute(resource.name)} from saved care options">Remove</button>
    </div>
  `).join('');
  translateConnectElement(elements.savedCareOptions);
}

function loadSavedResources() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return new Map();
    return new Map(
      saved.filter(r => r && typeof r === 'object' && r.id).map(r => [r.id, r])
    );
  } catch { return new Map(); }
}

function persistSavedResources() {
  localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify([...state.savedResources.values()]));
}

function setLocationButtonLoading(isLoading) {
  elements.useLocationButton.disabled = isLoading;
  elements.useLocationButton.setAttribute('aria-busy', String(isLoading));
  elements.useLocationButton.textContent = isLoading ? 'Finding location...' : 'Use my location';
  translateConnectElement(elements.useLocationButton);
}

function showGeolocationDenied() {
  showMessage('We could not access your location. You can still search by ZIP code, city, or address.', 'error');
}

function showMessage(message, type) {
  elements.locationMessage.textContent = message;
  elements.locationMessage.className   = `connect-message ${type}`;
  translateConnectElement(elements.locationMessage);
}

function clearMessage() {
  elements.locationMessage.textContent = '';
  elements.locationMessage.className   = 'connect-message';
}

function getLocationSuccessMessage(accuracyMeters) {
  if (!accuracyMeters) return 'Using your browser location to search nearby care options.';
  const accuracyMiles = accuracyMeters / 1609.344;
  if (accuracyMiles >= 1) return `Using your browser location. Distances may be off by about ${accuracyMiles.toFixed(1)} miles.`;
  return 'Using your browser location to search nearby care options.';
}

function buildGoogleMapsDirectionsUrl(resource) {
  if (!Number.isFinite(resource.lat) || !Number.isFinite(resource.lng)) {
    return resource.mapsUrl || 'https://www.google.com/maps';
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${resource.lat},${resource.lng}`)}&travelmode=driving`;
}

function createTelUrl(phone) { return `tel:${String(phone).replace(/\D/g, '')}`; }

function formatDistance(distance) {
  if (!Number.isFinite(distance)) return 'Distance unavailable';
  if (distance < 0.1) return 'Less than 0.1 miles';
  if (distance >= 100) return `${Math.round(distance)} miles`;
  return `${distance.toFixed(1)} miles`;
}

function getDotClass(type) {
  const normalized = String(type || '').toLowerCase();
  if (normalized.includes('pharmacy'))              return 'dot-pharmacy';
  if (normalized.includes('urgent'))                return 'dot-urgent';
  if (normalized.includes('hospital'))              return 'dot-fqhc';
  if (normalized.includes('mental'))                return 'dot-mental';
  if (normalized.includes('free') || normalized.includes('fqhc')) return 'dot-free-clinic';
  return 'dot-telehealth';
}

function escapeHTML(value) {
  return String(value || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function escapeAttribute(value) { return escapeHTML(value).replace(/`/g, '&#096;'); }

function translateConnectElement(element) {
  window.ClearCareI18n?.translateElement(element, { refreshOriginals: true });
}
