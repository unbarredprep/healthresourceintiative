/* ============================================================
   CLEARCARE - CONNECT PAGE JS
   Live provider search through Cloudflare Worker /api/connect/search
   ============================================================ */

const CONNECT_SEARCH_ENDPOINT = '/api/connect/search';
const SAVED_STORAGE_KEY = 'clearcare_saved_resources';

const DEFAULT_FILTERS = {
  careType: 'all',
  distance: 25
};

const FALLBACK_SAMPLE_RESULTS = [
  {
    id: 'sample-community-clinic',
    name: 'Sample Community Clinic',
    type: 'Clinic',
    category: 'Sample result',
    address: '123 Example Street',
    phone: '',
    website: '',
    directionsUrl: 'https://www.google.com/maps',
    mapsUrl: 'https://www.google.com/maps',
    hoursText: 'Sample only',
    source: 'Sample results',
    distanceMiles: null,
    disclaimer: 'Sample result only. Add a Google Maps API key to enable live search.'
  },
  {
    id: 'sample-urgent-care',
    name: 'Sample Urgent Care',
    type: 'Urgent care',
    category: 'Sample result',
    address: '456 Example Avenue',
    phone: '',
    website: '',
    directionsUrl: 'https://www.google.com/maps',
    mapsUrl: 'https://www.google.com/maps',
    hoursText: 'Sample only',
    source: 'Sample results',
    distanceMiles: null,
    disclaimer: 'Sample result only. Add a Google Maps API key to enable live search.'
  }
];

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
    form: document.getElementById('connectSearchForm'),
    input: document.getElementById('locationInput'),
    useLocationButton: document.getElementById('useLocationButton'),
    resetFiltersButton: document.getElementById('resetFiltersButton'),
    resultsArea: document.getElementById('resultsArea'),
    resultsSummary: document.getElementById('resultsSummary'),
    savedCareOptions: document.getElementById('savedCareOptions'),
    locationMessage: document.getElementById('locationMessage')
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
    {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 120000
    }
  );
}

async function performSearch() {
  if (!state.currentSearch) {
    renderInitialState();
    return;
  }

  if (state.activeController) {
    state.activeController.abort();
  }

  state.activeController = new AbortController();
  renderLoading();

  try {
    const data = await searchNearbyCare({
      ...state.currentSearch,
      radiusMiles: state.filters.distance,
      careType: state.filters.careType,
      signal: state.activeController.signal
    });

    if (data.configured === false) {
      renderApiNotConfigured(data.message);
      return;
    }

    state.latestResults = Array.isArray(data.results) ? data.results : [];
    renderResults(data);
  } catch (error) {
    if (error.name === 'AbortError') return;

    if (error.code === 'LOCATION_NOT_FOUND') {
      renderLocationNotFound();
      return;
    }

    if (error.code === 'API_NOT_CONFIGURED') {
      renderApiNotConfigured();
      return;
    }

    renderError('We could not search right now. Please try again.');
  } finally {
    state.activeController = null;
  }
}

async function searchNearbyCare({ locationQuery, lat, lng, locationLabel, radiusMiles, careType, signal }) {
  const response = await fetch(CONNECT_SEARCH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    signal,
    body: JSON.stringify({
      locationQuery,
      lat,
      lng,
      locationLabel,
      radiusMiles,
      careType
    })
  });

  const data = await readJsonResponse(response);

  if (!response.ok) {
    const error = new Error(data.message || 'Search failed');
    error.code = data.error || 'SEARCH_FAILED';
    throw error;
  }

  return data;
}

async function readJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const error = new Error('Live provider search is not configured yet.');
    error.code = 'API_NOT_CONFIGURED';
    throw error;
  }

  return response.json();
}

function updateFilter(button) {
  const filterName = button.dataset.filter;
  const rawValue = button.dataset.value;
  state.filters[filterName] = filterName === 'distance' ? Number(rawValue) : rawValue;

  updateFilterButtons(filterName, rawValue);

  if (state.currentSearch) {
    performSearch();
  }
}

function resetFilters() {
  state.filters = { ...DEFAULT_FILTERS };
  updateAllFilterButtons();

  if (state.currentSearch) {
    performSearch();
  } else {
    renderInitialState();
  }
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
      <p>You can also use your browser location. Results update when you change the care type or distance.</p>
    </div>
  `;
}

function renderLoading() {
  elements.resultsSummary.textContent = '';
  elements.resultsArea.innerHTML = `
    <div class="connect-state" role="status">
      <div class="connect-spinner" aria-hidden="true"></div>
      <strong>Searching nearby care options...</strong>
    </div>
  `;
}

function renderResults(data) {
  const resultWord = state.latestResults.length === 1 ? 'result' : 'results';
  const locationLabel = data.location?.label || state.currentSearch?.locationLabel || 'your search';

  elements.resultsSummary.textContent = `${state.latestResults.length} ${resultWord} near ${locationLabel}`;

  if (!state.latestResults.length) {
    renderNoResults();
    return;
  }

  elements.resultsArea.innerHTML = state.latestResults.map(renderResourceCard).join('');
}

function renderNoResults() {
  elements.resultsSummary.textContent = '';
  elements.resultsArea.innerHTML = `
    <div class="connect-state" role="status">
      <strong>No results found nearby. Try increasing the distance or changing filters.</strong>
    </div>
  `;
}

function renderLocationNotFound() {
  state.latestResults = [];
  elements.resultsSummary.textContent = '';
  elements.resultsArea.innerHTML = `
    <div class="connect-state connect-state-error" role="alert">
      <strong>We could not find that location. Try entering a ZIP code, city, or full address.</strong>
    </div>
  `;
}

function renderApiNotConfigured(message = 'Live provider search is not configured yet. Add a Google Maps API key to enable nationwide search.') {
  state.latestResults = FALLBACK_SAMPLE_RESULTS;
  elements.resultsSummary.textContent = 'Sample results';
  elements.resultsArea.innerHTML = `
    <div class="connect-state connect-setup-state" role="status">
      <strong>Live provider search is not configured yet.</strong>
      <p>${escapeHTML(message)}</p>
      <p>These backup cards are sample results only.</p>
    </div>
    ${FALLBACK_SAMPLE_RESULTS.map(renderResourceCard).join('')}
  `;
}

function renderError(message) {
  state.latestResults = [];
  elements.resultsSummary.textContent = '';
  elements.resultsArea.innerHTML = `
    <div class="connect-state connect-state-error" role="alert">
      <strong>${escapeHTML(message)}</strong>
    </div>
  `;
}

function renderGeolocationDenied() {
  state.latestResults = [];
  elements.resultsSummary.textContent = '';
  elements.resultsArea.innerHTML = `
    <div class="connect-state connect-state-error" role="alert">
      <strong>We could not access your location. You can still search by ZIP code, city, or address.</strong>
    </div>
  `;
}

function renderResourceCard(resource) {
  const isSaved = state.savedResources.has(resource.id);
  const directionsUrl = resource.directionsUrl || resource.mapsUrl || buildGoogleMapsDirectionsUrl(resource);
  const phoneMarkup = resource.phone
    ? `<a class="btn btn-outline" href="${createTelUrl(resource.phone)}">Call ${escapeHTML(resource.phone)}</a>`
    : '<span class="connect-action-note">Phone not listed</span>';
  const websiteMarkup = resource.website
    ? `<a class="btn btn-outline" href="${escapeAttribute(resource.website)}" target="_blank" rel="noopener noreferrer">Website</a>`
    : '';

  return `
    <article class="clinic-card connect-resource-card">
      <div class="clinic-dot ${getDotClass(resource.type)}" aria-hidden="true"></div>
      <div class="connect-resource-main">
        <div class="connect-resource-topline">
          <div>
            <h3 class="clinic-name">${escapeHTML(resource.name)}</h3>
            <div class="connect-resource-location">${escapeHTML(resource.category || resource.type || 'Care resource')}</div>
          </div>
          <span class="connect-distance">${formatDistance(resource.distanceMiles)}</span>
        </div>

        <div class="clinic-chips">
          <span class="chip connect-type-chip">${escapeHTML(resource.type || 'Care resource')}</span>
          <span class="chip connect-source-chip">${escapeHTML(resource.source || 'Provider search')}</span>
        </div>

        <div class="connect-resource-details">
          <div><strong>Address:</strong> ${escapeHTML(resource.address || 'Address not available')}</div>
          <div><strong>Hours:</strong> ${escapeHTML(resource.hoursText || 'Call to confirm hours')}</div>
        </div>

        <div class="connect-resource-actions">
          ${phoneMarkup}
          <a class="btn btn-outline" href="${escapeAttribute(directionsUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open Google Maps directions to ${escapeAttribute(resource.name)}">Directions</a>
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

  if (state.savedResources.has(resource.id)) {
    removeSavedResource(resource.id);
  } else {
    saveResource(resource);
  }
}

function handleSavedAction(event) {
  const removeButton = event.target.closest('[data-remove-saved]');
  if (!removeButton) return;

  removeSavedResource(removeButton.dataset.removeSaved);
}

function saveResource(resource) {
  state.savedResources.set(resource.id, {
    id: resource.id,
    name: resource.name,
    type: resource.type,
    category: resource.category,
    address: resource.address,
    phone: resource.phone,
    website: resource.website,
    directionsUrl: resource.directionsUrl,
    mapsUrl: resource.mapsUrl,
    hoursText: resource.hoursText,
    source: resource.source,
    disclaimer: resource.disclaimer
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
  if (state.latestResults.length) {
    const setupState = elements.resultsArea.querySelector('.connect-setup-state');
    elements.resultsArea.innerHTML = setupState
      ? `${setupState.outerHTML}${state.latestResults.map(renderResourceCard).join('')}`
      : state.latestResults.map(renderResourceCard).join('');
  }
}

function renderSavedCare() {
  const savedResources = [...state.savedResources.values()];

  if (!savedResources.length) {
    elements.savedCareOptions.innerHTML = '<p class="connect-empty-small">Save resources you may want to call later.</p>';
    return;
  }

  elements.savedCareOptions.innerHTML = savedResources.map(resource => `
    <div class="connect-saved-item">
      <div>
        <strong>${escapeHTML(resource.name)}</strong>
        <span>${escapeHTML(resource.type || 'Care resource')} - ${escapeHTML(resource.phone || 'Phone not listed')}</span>
      </div>
      <button type="button" class="connect-remove-saved" data-remove-saved="${escapeAttribute(resource.id)}" aria-label="Remove ${escapeAttribute(resource.name)} from saved care options">Remove</button>
    </div>
  `).join('');
}

function loadSavedResources() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return new Map();

    return new Map(
      saved
        .filter(resource => resource && typeof resource === 'object' && resource.id)
        .map(resource => [resource.id, resource])
    );
  } catch (error) {
    return new Map();
  }
}

function persistSavedResources() {
  localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify([...state.savedResources.values()]));
}

function setLocationButtonLoading(isLoading) {
  elements.useLocationButton.disabled = isLoading;
  elements.useLocationButton.setAttribute('aria-busy', String(isLoading));
  elements.useLocationButton.textContent = isLoading ? 'Finding location...' : 'Use my location';
}

function showGeolocationDenied() {
  showMessage('We could not access your location. You can still search by ZIP code, city, or address.', 'error');
}

function showMessage(message, type) {
  elements.locationMessage.textContent = message;
  elements.locationMessage.className = `connect-message ${type}`;
}

function clearMessage() {
  elements.locationMessage.textContent = '';
  elements.locationMessage.className = 'connect-message';
}

function getLocationSuccessMessage(accuracyMeters) {
  if (!accuracyMeters) return 'Using your browser location to search nearby care options.';

  const accuracyMiles = accuracyMeters / 1609.344;
  if (accuracyMiles >= 1) {
    return `Using your browser location. Distances may be off by about ${accuracyMiles.toFixed(1)} miles.`;
  }

  return 'Using your browser location to search nearby care options.';
}

function buildGoogleMapsDirectionsUrl(resource) {
  if (!Number.isFinite(resource.lat) || !Number.isFinite(resource.lng)) {
    return resource.mapsUrl || 'https://www.google.com/maps';
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${resource.lat},${resource.lng}`)}&travelmode=driving`;
}

function createTelUrl(phone) {
  return `tel:${String(phone).replace(/\D/g, '')}`;
}

function formatDistance(distance) {
  if (!Number.isFinite(distance)) return 'Distance unavailable';
  if (distance < 0.1) return 'Less than 0.1 miles';
  if (distance >= 100) return `${Math.round(distance)} miles`;
  return `${distance.toFixed(1)} miles`;
}

function getDotClass(type) {
  const normalized = String(type || '').toLowerCase();
  if (normalized.includes('pharmacy')) return 'dot-pharmacy';
  if (normalized.includes('urgent')) return 'dot-urgent';
  if (normalized.includes('hospital')) return 'dot-fqhc';
  if (normalized.includes('mental')) return 'dot-mental';
  if (normalized.includes('low-cost') || normalized.includes('free')) return 'dot-free-clinic';
  return 'dot-telehealth';
}

function escapeHTML(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttribute(value) {
  return escapeHTML(value).replace(/`/g, '&#096;');
}
