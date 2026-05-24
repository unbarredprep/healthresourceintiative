/* ============================================================
   CLEARCARE - CONNECT PAGE JS
   Local demo search for nearby free and low-cost care resources
   ============================================================ */

const CARE_RESOURCES = [
  {
    id: 'oak-street-community-clinic',
    name: 'Oak Street Community Clinic',
    type: 'Free clinic',
    city: 'Dallas',
    state: 'TX',
    zip: '75201',
    lat: 32.7831,
    lng: -96.8067,
    address: '1801 North Pearl Street, Dallas, TX 75201',
    phone: '(214) 555-0118',
    status: 'Open today 8am-5pm',
    languages: ['English', 'Spanish', 'Vietnamese'],
    payment: ['Uninsured welcome', 'Sliding scale', 'Low-cost']
  },
  {
    id: 'south-dallas-fqhc',
    name: 'South Dallas Family Health Hub',
    type: 'FQHC',
    city: 'Dallas',
    state: 'TX',
    zip: '75215',
    lat: 32.7596,
    lng: -96.7644,
    address: '2920 Martin Luther King Jr Blvd, Dallas, TX 75215',
    phone: '(214) 555-0142',
    status: 'Open today 7:30am-6pm',
    languages: ['English', 'Spanish'],
    payment: ['Uninsured welcome', 'Sliding scale', 'Medicaid']
  },
  {
    id: 'cedar-bridge-urgent-care',
    name: 'Cedar Bridge Urgent Care',
    type: 'Urgent care',
    city: 'Irving',
    state: 'TX',
    zip: '75060',
    lat: 32.8140,
    lng: -96.9489,
    address: '410 East Irving Blvd, Irving, TX 75060',
    phone: '(972) 555-0194',
    status: 'Open today 9am-9pm',
    languages: ['English', 'Spanish', 'Korean'],
    payment: ['Medicaid', 'Low-cost']
  },
  {
    id: 'garland-wellness-center',
    name: 'Garland Wellness and Counseling Center',
    type: 'Mental health',
    city: 'Garland',
    state: 'TX',
    zip: '75040',
    lat: 32.9126,
    lng: -96.6389,
    address: '1220 West Walnut Street, Garland, TX 75040',
    phone: '(972) 555-0126',
    status: 'Call for hours',
    languages: ['English', 'Spanish', 'Arabic'],
    payment: ['Uninsured welcome', 'Sliding scale', 'Medicaid']
  },
  {
    id: 'plano-low-cost-pharmacy',
    name: 'Plano Low-Cost Pharmacy Desk',
    type: 'Pharmacy',
    city: 'Plano',
    state: 'TX',
    zip: '75024',
    lat: 33.0750,
    lng: -96.8124,
    address: '7201 Bishop Road, Plano, TX 75024',
    phone: '(469) 555-0155',
    status: 'Open today 8am-8pm',
    languages: ['English', 'Chinese', 'Korean'],
    payment: ['Low-cost', 'Medicaid']
  },
  {
    id: 'arlington-connect-telehealth',
    name: 'Arlington Connect Telehealth',
    type: 'Telehealth',
    city: 'Arlington',
    state: 'TX',
    zip: '76010',
    lat: 32.7357,
    lng: -97.1081,
    address: '101 East Abram Street, Arlington, TX 76010',
    phone: '(817) 555-0182',
    status: 'Virtual visits available today',
    languages: ['English', 'Spanish', 'Vietnamese'],
    payment: ['Uninsured welcome', 'Sliding scale', 'Low-cost']
  },
  {
    id: 'tarrant-neighborhood-clinic',
    name: 'Tarrant Neighborhood Clinic',
    type: 'Free clinic',
    city: 'Fort Worth',
    state: 'TX',
    zip: '76102',
    lat: 32.7555,
    lng: -97.3308,
    address: '500 West 7th Street, Fort Worth, TX 76102',
    phone: '(817) 555-0161',
    status: 'Open today 8am-4pm',
    languages: ['English', 'Spanish'],
    payment: ['Uninsured welcome', 'Sliding scale']
  },
  {
    id: 'carrollton-family-fqhc',
    name: 'Carrollton Family Care FQHC',
    type: 'FQHC',
    city: 'Carrollton',
    state: 'TX',
    zip: '75006',
    lat: 32.9756,
    lng: -96.8899,
    address: '1115 Belt Line Road, Carrollton, TX 75006',
    phone: '(469) 555-0177',
    status: 'Open today 8am-5:30pm',
    languages: ['English', 'Spanish', 'Korean'],
    payment: ['Uninsured welcome', 'Sliding scale', 'Medicaid']
  },
  {
    id: 'east-houston-community-health',
    name: 'East Houston Community Health Center',
    type: 'FQHC',
    city: 'Houston',
    state: 'TX',
    zip: '77003',
    lat: 29.7499,
    lng: -95.3356,
    address: '3100 Harrisburg Blvd, Houston, TX 77003',
    phone: '(713) 555-0108',
    status: 'Open today 8am-6pm',
    languages: ['English', 'Spanish', 'Vietnamese'],
    payment: ['Uninsured welcome', 'Sliding scale', 'Medicaid']
  },
  {
    id: 'houston-bridge-mental-health',
    name: 'Houston Bridge Mental Health Line',
    type: 'Mental health',
    city: 'Houston',
    state: 'TX',
    zip: '77002',
    lat: 29.7604,
    lng: -95.3698,
    address: '901 Bagby Street, Houston, TX 77002',
    phone: '(713) 555-0149',
    status: 'Same-day phone screening',
    languages: ['English', 'Spanish', 'Arabic'],
    payment: ['Uninsured welcome', 'Sliding scale', 'Low-cost']
  },
  {
    id: 'montrose-low-cost-pharmacy',
    name: 'Montrose Low-Cost Pharmacy',
    type: 'Pharmacy',
    city: 'Houston',
    state: 'TX',
    zip: '77006',
    lat: 29.7427,
    lng: -95.3914,
    address: '1600 Westheimer Road, Houston, TX 77006',
    phone: '(713) 555-0188',
    status: 'Open today 9am-7pm',
    languages: ['English', 'Spanish', 'Chinese'],
    payment: ['Low-cost', 'Medicaid']
  },
  {
    id: 'austin-community-clinic',
    name: 'Austin Community Clinic',
    type: 'Free clinic',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    lat: 30.2672,
    lng: -97.7431,
    address: '1100 Congress Avenue, Austin, TX 78701',
    phone: '(512) 555-0134',
    status: 'Open today 8:30am-5pm',
    languages: ['English', 'Spanish', 'Arabic'],
    payment: ['Uninsured welcome', 'Sliding scale', 'Low-cost']
  },
  {
    id: 'north-austin-urgent-care',
    name: 'North Austin Urgent Care Access',
    type: 'Urgent care',
    city: 'Austin',
    state: 'TX',
    zip: '78758',
    lat: 30.3840,
    lng: -97.7073,
    address: '9200 North Lamar Blvd, Austin, TX 78758',
    phone: '(512) 555-0168',
    status: 'Open today 10am-8pm',
    languages: ['English', 'Spanish', 'Vietnamese'],
    payment: ['Medicaid', 'Low-cost']
  },
  {
    id: 'san-antonio-family-health',
    name: 'San Antonio Family Health Access',
    type: 'FQHC',
    city: 'San Antonio',
    state: 'TX',
    zip: '78205',
    lat: 29.4241,
    lng: -98.4936,
    address: '115 Plaza de Armas, San Antonio, TX 78205',
    phone: '(210) 555-0123',
    status: 'Open today 8am-5pm',
    languages: ['English', 'Spanish', 'Arabic'],
    payment: ['Uninsured welcome', 'Sliding scale', 'Medicaid']
  },
  {
    id: 'el-paso-telehealth-access',
    name: 'El Paso Telehealth Access Point',
    type: 'Telehealth',
    city: 'El Paso',
    state: 'TX',
    zip: '79901',
    lat: 31.7619,
    lng: -106.4850,
    address: '300 North Campbell Street, El Paso, TX 79901',
    phone: '(915) 555-0114',
    status: 'Virtual visits available today',
    languages: ['English', 'Spanish', 'Chinese'],
    payment: ['Uninsured welcome', 'Sliding scale', 'Low-cost']
  },
  {
    id: 'loop-community-health',
    name: 'Loop Community Health Clinic',
    type: 'Free clinic',
    city: 'Chicago',
    state: 'IL',
    zip: '60601',
    lat: 41.8839,
    lng: -87.6236,
    address: '70 East Lake Street, Chicago, IL 60601',
    phone: '(312) 555-0132',
    status: 'Open today 8am-4pm',
    languages: ['English', 'Spanish', 'Chinese'],
    payment: ['Uninsured welcome', 'Sliding scale', 'Low-cost']
  },
  {
    id: 'northwest-chicago-mental-health',
    name: 'Northwest Chicago Mental Health Support',
    type: 'Mental health',
    city: 'Chicago',
    state: 'IL',
    zip: '60618',
    lat: 41.9467,
    lng: -87.7026,
    address: '3300 North California Avenue, Chicago, IL 60618',
    phone: '(773) 555-0191',
    status: 'Call for hours',
    languages: ['English', 'Spanish', 'Korean'],
    payment: ['Uninsured welcome', 'Sliding scale', 'Medicaid']
  }
];

const LOCATION_LOOKUP = {
  '75201': { label: 'Dallas, TX', lat: 32.7767, lng: -96.7970 },
  'dallas': { label: 'Dallas, TX', lat: 32.7767, lng: -96.7970 },
  'dallas tx': { label: 'Dallas, TX', lat: 32.7767, lng: -96.7970 },
  '75060': { label: 'Irving, TX', lat: 32.8140, lng: -96.9489 },
  'irving': { label: 'Irving, TX', lat: 32.8140, lng: -96.9489 },
  '76010': { label: 'Arlington, TX', lat: 32.7357, lng: -97.1081 },
  'arlington': { label: 'Arlington, TX', lat: 32.7357, lng: -97.1081 },
  '76102': { label: 'Fort Worth, TX', lat: 32.7555, lng: -97.3308 },
  'fort worth': { label: 'Fort Worth, TX', lat: 32.7555, lng: -97.3308 },
  '75024': { label: 'Plano, TX', lat: 33.0750, lng: -96.8124 },
  'plano': { label: 'Plano, TX', lat: 33.0750, lng: -96.8124 },
  '75040': { label: 'Garland, TX', lat: 32.9126, lng: -96.6389 },
  'garland': { label: 'Garland, TX', lat: 32.9126, lng: -96.6389 },
  '75006': { label: 'Carrollton, TX', lat: 32.9756, lng: -96.8899 },
  'carrollton': { label: 'Carrollton, TX', lat: 32.9756, lng: -96.8899 },
  '77002': { label: 'Houston, TX', lat: 29.7604, lng: -95.3698 },
  '77003': { label: 'Houston, TX', lat: 29.7499, lng: -95.3356 },
  'houston': { label: 'Houston, TX', lat: 29.7604, lng: -95.3698 },
  '78701': { label: 'Austin, TX', lat: 30.2672, lng: -97.7431 },
  'austin': { label: 'Austin, TX', lat: 30.2672, lng: -97.7431 },
  '78205': { label: 'San Antonio, TX', lat: 29.4241, lng: -98.4936 },
  'san antonio': { label: 'San Antonio, TX', lat: 29.4241, lng: -98.4936 },
  '79901': { label: 'El Paso, TX', lat: 31.7619, lng: -106.4850 },
  'el paso': { label: 'El Paso, TX', lat: 31.7619, lng: -106.4850 },
  '60601': { label: 'Chicago, IL', lat: 41.8839, lng: -87.6236 },
  '60618': { label: 'Chicago, IL', lat: 41.9467, lng: -87.7026 },
  'chicago': { label: 'Chicago, IL', lat: 41.8839, lng: -87.6236 }
};

const DEFAULT_FILTERS = {
  type: 'all',
  payment: 'all',
  language: 'all',
  distance: 25
};

const state = {
  origin: LOCATION_LOOKUP.dallas,
  filters: { ...DEFAULT_FILTERS },
  savedIds: new Set(loadSavedIds()),
  searchTimer: null
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

  renderResults();
  renderSavedCare();
});

function handleSearchSubmit(event) {
  event.preventDefault();
  clearMessage();

  const locationText = elements.input.value.trim();
  if (!locationText) {
    elements.input.focus();
    elements.input.setAttribute('aria-invalid', 'true');
    showMessage('Enter a ZIP code or city to search nearby care.', 'error');
    return;
  }

  elements.input.removeAttribute('aria-invalid');
  const location = lookupLocation(locationText);

  if (!location) {
    renderError('We could not search right now. Please try again.');
    return;
  }

  runSearch(location);
}

function handleUseLocation() {
  clearMessage();

  if (!('geolocation' in navigator)) {
    showGeolocationDenied();
    return;
  }

  elements.useLocationButton.disabled = true;
  showMessage('Asking your browser for your location...', 'info');

  navigator.geolocation.getCurrentPosition(
    position => {
      const currentLocation = {
        label: 'your current location',
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      elements.input.value = 'Current location';
      elements.useLocationButton.disabled = false;
      showMessage('Using your location to sort nearby sample resources.', 'success');
      runSearch(currentLocation);
    },
    () => {
      elements.useLocationButton.disabled = false;
      showGeolocationDenied();
    },
    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000
    }
  );
}

function runSearch(location) {
  state.origin = location;
  renderLoading();

  window.clearTimeout(state.searchTimer);
  state.searchTimer = window.setTimeout(() => {
    try {
      renderResults();
    } catch (error) {
      renderError('We could not search right now. Please try again.');
    }
  }, 450);
}

function lookupLocation(input) {
  const normalized = normalizeLocationInput(input);
  if (normalized === 'current location' && state.origin.label === 'your current location') {
    return state.origin;
  }

  const withoutState = normalized.replace(/\s+(tx|il)$/i, '').trim();
  const zipMatch = input.match(/\b\d{5}\b/);

  return LOCATION_LOOKUP[normalized]
    || LOCATION_LOOKUP[withoutState]
    || (zipMatch ? LOCATION_LOOKUP[zipMatch[0]] : null)
    || null;
}

function normalizeLocationInput(input) {
  return input
    .toLowerCase()
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function updateFilter(button) {
  const filterName = button.dataset.filter;
  const rawValue = button.dataset.value;
  state.filters[filterName] = filterName === 'distance' ? Number(rawValue) : rawValue;

  updateFilterButtons(filterName, rawValue);
  renderResults();
}

function resetFilters() {
  state.filters = { ...DEFAULT_FILTERS };
  updateAllFilterButtons();
  renderResults();
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

function calculateDistanceMiles(origin, resource) {
  const earthRadiusMiles = 3958.8;
  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(resource.lat);
  const deltaLat = toRadians(resource.lat - origin.lat);
  const deltaLng = toRadians(resource.lng - origin.lng);

  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMiles * c;
}

function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

function filterResources(resources, filters, origin) {
  return resources
    .map(resource => ({
      ...resource,
      distance: calculateDistanceMiles(origin, resource)
    }))
    .filter(resource => {
      const matchesType = filters.type === 'all' || resource.type === filters.type;
      const matchesPayment = filters.payment === 'all' || resource.payment.includes(filters.payment);
      const matchesLanguage = filters.language === 'all' || resource.languages.includes(filters.language);
      const matchesDistance = resource.distance <= filters.distance;

      return matchesType && matchesPayment && matchesLanguage && matchesDistance;
    })
    .sort((first, second) => first.distance - second.distance);
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

function renderError(message) {
  window.clearTimeout(state.searchTimer);
  elements.resultsSummary.textContent = '';
  elements.resultsArea.innerHTML = `
    <div class="connect-state connect-state-error" role="alert">
      <strong>${escapeHTML(message)}</strong>
    </div>
  `;
}

function renderResults() {
  const results = filterResources(CARE_RESOURCES, state.filters, state.origin);
  const resultWord = results.length === 1 ? 'result' : 'results';

  elements.resultsSummary.textContent = `${results.length} ${resultWord} near ${state.origin.label}`;

  if (!results.length) {
    elements.resultsArea.innerHTML = `
      <div class="connect-state" role="status">
        <strong>No nearby results found. Try expanding the distance or changing filters.</strong>
      </div>
    `;
    return;
  }

  elements.resultsArea.innerHTML = results.map(renderResourceCard).join('');
}

function renderResourceCard(resource) {
  const isSaved = state.savedIds.has(resource.id);
  const mapsUrl = createMapsUrl(resource);
  const telUrl = createTelUrl(resource.phone);
  const paymentBadges = resource.payment.map(option => `<span class="chip chip-ok">${escapeHTML(option)}</span>`).join('');
  const languages = resource.languages.map(escapeHTML).join(', ');

  return `
    <article class="clinic-card connect-resource-card">
      <div class="clinic-dot ${getDotClass(resource.type)}" aria-hidden="true"></div>
      <div class="connect-resource-main">
        <div class="connect-resource-topline">
          <div>
            <h3 class="clinic-name">${escapeHTML(resource.name)}</h3>
            <div class="connect-resource-location">${escapeHTML(resource.city)}, ${escapeHTML(resource.state)} ${escapeHTML(resource.zip)}</div>
          </div>
          <span class="connect-distance">${formatDistance(resource.distance)}</span>
        </div>

        <div class="clinic-chips">
          <span class="chip connect-type-chip">${escapeHTML(resource.type)}</span>
          ${paymentBadges}
        </div>

        <div class="connect-resource-details">
          <div><strong>Address:</strong> ${escapeHTML(resource.address)}</div>
          <div><strong>Hours:</strong> ${escapeHTML(resource.status)}</div>
          <div><strong>Languages:</strong> ${languages}</div>
        </div>

        <div class="connect-resource-actions">
          <a class="btn btn-outline" href="${telUrl}">Call ${escapeHTML(resource.phone)}</a>
          <a class="btn btn-outline" href="${mapsUrl}" target="_blank" rel="noreferrer">Directions</a>
          <button class="btn ${isSaved ? 'btn-outline' : 'btn-primary'}" type="button" data-save-id="${escapeHTML(resource.id)}">
            ${isSaved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderSavedCare() {
  const savedResources = CARE_RESOURCES.filter(resource => state.savedIds.has(resource.id));

  if (!savedResources.length) {
    elements.savedCareOptions.innerHTML = '<p class="connect-empty-small">Save resources you may want to call later.</p>';
    return;
  }

  elements.savedCareOptions.innerHTML = savedResources.map(resource => `
    <div class="connect-saved-item">
      <div>
        <strong>${escapeHTML(resource.name)}</strong>
        <span>${escapeHTML(resource.type)} - ${escapeHTML(resource.phone)}</span>
      </div>
      <button type="button" class="connect-remove-saved" data-remove-saved="${escapeHTML(resource.id)}" aria-label="Remove ${escapeHTML(resource.name)} from saved care options">Remove</button>
    </div>
  `).join('');
}

function handleResultAction(event) {
  const saveButton = event.target.closest('[data-save-id]');
  if (!saveButton) return;

  toggleSavedResource(saveButton.dataset.saveId);
}

function handleSavedAction(event) {
  const removeButton = event.target.closest('[data-remove-saved]');
  if (!removeButton) return;

  toggleSavedResource(removeButton.dataset.removeSaved, false);
}

function toggleSavedResource(resourceId, forceSaved) {
  const shouldSave = typeof forceSaved === 'boolean'
    ? forceSaved
    : !state.savedIds.has(resourceId);

  if (shouldSave) {
    state.savedIds.add(resourceId);
  } else {
    state.savedIds.delete(resourceId);
  }

  persistSavedIds();
  renderSavedCare();
  renderResults();
}

function loadSavedIds() {
  try {
    const saved = JSON.parse(localStorage.getItem('clearcare_saved_resources') || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function persistSavedIds() {
  localStorage.setItem('clearcare_saved_resources', JSON.stringify([...state.savedIds]));
}

function showGeolocationDenied() {
  showMessage('We could not access your location. You can still search by ZIP code or city.', 'error');
}

function showMessage(message, type) {
  elements.locationMessage.textContent = message;
  elements.locationMessage.className = `connect-message ${type}`;
}

function clearMessage() {
  elements.locationMessage.textContent = '';
  elements.locationMessage.className = 'connect-message';
}

function createMapsUrl(resource) {
  const query = `${resource.address} ${resource.lat},${resource.lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function createTelUrl(phone) {
  return `tel:${phone.replace(/\D/g, '')}`;
}

function formatDistance(distance) {
  if (distance < 0.1) return 'Less than 0.1 miles';
  return `${distance.toFixed(1)} miles`;
}

function getDotClass(type) {
  const classByType = {
    'Free clinic': 'dot-free-clinic',
    FQHC: 'dot-fqhc',
    'Urgent care': 'dot-urgent',
    'Mental health': 'dot-mental',
    Pharmacy: 'dot-pharmacy',
    Telehealth: 'dot-telehealth'
  };

  return classByType[type] || '';
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
