const LANGUAGES = [
  { code: 'en', label: 'English',            nativeLabel: 'English',    instructionName: 'English',           dir: 'ltr' },
  { code: 'es', label: 'Spanish',            nativeLabel: 'Español',    instructionName: 'Spanish',           dir: 'ltr' },
  { code: 'ne', label: 'Nepali',             nativeLabel: 'नेपाली',      instructionName: 'Nepali',            dir: 'ltr' },
  { code: 'hi', label: 'Hindi',              nativeLabel: 'हिन्दी',      instructionName: 'Hindi',             dir: 'ltr' },
  { code: 'ar', label: 'Arabic',             nativeLabel: 'العربية',    instructionName: 'Arabic',            dir: 'rtl' },
  { code: 'vi', label: 'Vietnamese',         nativeLabel: 'Tiếng Việt', instructionName: 'Vietnamese',        dir: 'ltr' },
  { code: 'zh', label: 'Chinese Simplified', nativeLabel: '简体中文',     instructionName: 'Simplified Chinese', dir: 'ltr' },
  { code: 'fr', label: 'French',             nativeLabel: 'Français',   instructionName: 'French',            dir: 'ltr' },
  { code: 'ur', label: 'Urdu',               nativeLabel: 'اردو',       instructionName: 'Urdu',              dir: 'rtl' },
  { code: 'ko', label: 'Korean',             nativeLabel: '한국어',       instructionName: 'Korean',            dir: 'ltr' }
];

const languageMap = new Map(LANGUAGES.map(l => [l.code, l]));

function getLanguage(code) {
  return languageMap.get(String(code || '').trim().toLowerCase()) || LANGUAGES[0];
}

const CENSUS_GEOCODER_URL   = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress';
const ZIPPOPOTAMUS_URL       = 'https://api.zippopotam.us/us';
const NOMINATIM_SEARCH_URL   = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URL           = 'https://overpass-api.de/api/interpreter';
const HRSA_HEALTH_CENTERS_URL = 'https://data.hrsa.gov/HDWAPI3_External/api/v1/GetHealthCentersAroundALocation';
const GROQ_API_URL           = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_GROQ_MODEL     = 'llama-3.3-70b-versatile';
const APP_USER_AGENT         = 'ClearCare/1.0 (https://github.com/unbarredprep/healthresourceintiative)';
const CACHE_TTL_MS           = 10 * 60 * 1000;
const MAX_RESULTS            = 30;
const MAX_HEALTH_INPUT_CHARS = 12000;
const MAX_IMAGE_DATA_URL_CHARS = 7000000;
const MAX_UI_TRANSLATION_STRINGS = 100;
const MAX_UI_TRANSLATION_CHARS   = 500;

const cache = new Map();
let lastNominatimRequestAt = 0;

const CARE_SEARCHES = {
  all: {
    label: 'Care resource',
    osmFilters: [['amenity', 'pharmacy|hospital|clinic|doctors'], ['healthcare', 'clinic|doctor|hospital|pharmacy']],
    includeHrsa: true
  },
  clinics: {
    label: 'Clinic',
    osmFilters: [['amenity', 'clinic|doctors'], ['healthcare', 'clinic|doctor']],
    includeHrsa: true
  },
  pharmacies: {
    label: 'Pharmacy',
    osmFilters: [['amenity', 'pharmacy'], ['healthcare', 'pharmacy']],
    includeHrsa: false
  },
  urgent: {
    label: 'Urgent care',
    osmFilters: [['amenity', 'clinic|hospital|doctors'], ['healthcare', 'clinic|doctor|hospital']],
    includeHrsa: false,
    textTerms: ['urgent', 'walk-in', 'walk in', 'immediate care', 'emergency']
  },
  hospitals: {
    label: 'Hospital',
    osmFilters: [['amenity', 'hospital'], ['healthcare', 'hospital']],
    includeHrsa: false
  },
  mental: {
    label: 'Mental health',
    osmFilters: [['amenity', 'clinic|doctors'], ['healthcare', 'clinic|doctor|psychotherapist']],
    includeHrsa: false,
    textTerms: ['mental', 'behavioral', 'psychiatry', 'psychiatric', 'psychology', 'counseling', 'therapy', 'therapist']
  },
  low_cost: {
    label: 'Low-cost/free care',
    osmFilters: [['amenity', 'clinic|doctors'], ['healthcare', 'clinic|doctor']],
    includeHrsa: true,
    textTerms: ['free', 'community', 'fqhc', 'federally qualified', 'sliding', 'low cost', 'low-cost', 'public health']
  }
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/connect/search')      return handleConnectSearch(request, env);
    if (url.pathname === '/api/health-output')       return handleHealthOutput(request, env);
    if (url.pathname === '/api/health-output/status') return handleHealthOutputStatus(request, env);
    if (url.pathname === '/api/ui-translate')        return handleUiTranslate(request, env);
    return env.ASSETS.fetch(request);
  }
};

/* ── Route handlers ── */

async function handleConnectSearch(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  if (request.method !== 'POST') return jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405);

  let payload;
  try { payload = await request.json(); }
  catch { return jsonResponse({ error: 'BAD_REQUEST', message: 'Invalid search request.' }, 400); }

  try {
    const radiusMiles = normalizeRadiusMiles(payload.radiusMiles);
    const careType    = normalizeCareType(payload.careType);
    const location    = payload.lat !== undefined && payload.lng !== undefined
      ? normalizeCoordinateLocation(payload)
      : await geocodeLocation(payload.locationQuery, env);

    if (!location) {
      return jsonResponse({ error: 'LOCATION_NOT_FOUND', message: 'We could not find that location. Try a ZIP code, city, or full address.' }, 404);
    }

    const results = await searchNearbyCare({ lat: location.lat, lng: location.lng, radiusMiles, careType, env });
    return jsonResponse({ configured: true, location, radiusMiles, careType, results });
  } catch (err) {
    console.error('Connect search failed', err);
    return jsonResponse({ error: 'SEARCH_FAILED', message: 'We could not search right now. Please try again.' }, 502);
  }
}

async function handleHealthOutput(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  if (request.method !== 'POST') return jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405, { 'Cache-Control': 'no-store' });

  const groqApiKey = getGroqApiKey(env);
  if (!groqApiKey) {
    return jsonResponse({ error: 'AI_NOT_CONFIGURED', message: 'Add GROQ_API_KEY as a Cloudflare secret.' }, 503, { 'Cache-Control': 'no-store' });
  }

  let payload;
  try { payload = await request.json(); }
  catch { return jsonResponse({ error: 'BAD_REQUEST', message: 'Invalid request.' }, 400, { 'Cache-Control': 'no-store' }); }

  try {
    const taskType        = normalizeHealthTaskType(payload.taskType);
    const selectedLanguage = getLanguage(payload.language);
    const input           = normalizeHealthInput(payload.input, taskType);

    if (!input) {
      return jsonResponse({ error: 'BAD_REQUEST', message: 'Add document text or appointment details first.' }, 400, { 'Cache-Control': 'no-store' });
    }

    const output = await generateHealthOutput({ input, selectedLanguage, taskType, groqApiKey });
    return jsonResponse({ taskType, language: selectedLanguage, output }, 200, { 'Cache-Control': 'no-store' });
  } catch (err) {
    console.error('Health output failed', err);
    return jsonResponse({ error: err.code || 'AI_OUTPUT_FAILED', message: err.publicMessage || 'We could not generate output right now. Please try again.' }, err.status || 502, { 'Cache-Control': 'no-store' });
  }
}

function handleHealthOutputStatus(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  return jsonResponse({ configured: Boolean(getGroqApiKey(env)), model: DEFAULT_GROQ_MODEL }, 200, { 'Cache-Control': 'no-store' });
}

async function handleUiTranslate(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  if (request.method !== 'POST') return jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405, { 'Cache-Control': 'no-store' });

  const groqApiKey = getGroqApiKey(env);
  if (!groqApiKey) {
    return jsonResponse({ error: 'AI_NOT_CONFIGURED', message: 'Add GROQ_API_KEY as a Cloudflare secret.' }, 503, { 'Cache-Control': 'no-store' });
  }

  let payload;
  try { payload = await request.json(); }
  catch { return jsonResponse({ error: 'BAD_REQUEST', message: 'Invalid translation request.' }, 400, { 'Cache-Control': 'no-store' }); }

  try {
    const selectedLanguage = getLanguage(payload.language);
    const strings          = normalizeUiStrings(payload.strings);

    if (!strings.length || selectedLanguage.code === 'en') {
      return jsonResponse({ language: selectedLanguage, translations: Object.fromEntries(strings.map(s => [s, s])) }, 200, { 'Cache-Control': 'no-store' });
    }

    const translations = await translateUiStrings({ strings, selectedLanguage, groqApiKey });
    return jsonResponse({ language: selectedLanguage, translations }, 200, { 'Cache-Control': 'no-store' });
  } catch (err) {
    console.error('UI translate failed', err);
    return jsonResponse({ error: 'UI_TRANSLATION_FAILED', message: 'Could not translate right now.' }, 502, { 'Cache-Control': 'no-store' });
  }
}

/* ── AI functions ── */

async function generateHealthOutput({ input, selectedLanguage, taskType, groqApiKey }) {
  const schema = taskType === 'understand'
    ? `{"simpleSummary":"string","whatThisMightMean":"string","importantInstructions":["string"],"questionsToAskDoctor":["string"],"whenToSeekUrgentHelp":["string"],"disclaimer":"string"}`
    : `{"appointmentSummary":"string","topQuestionsToAsk":["string"],"symptomsDetailsToMention":["string"],"medicationsDocumentsToBring":["string"],"redFlagsToRaise":["string"],"disclaimer":"string"}`;

  const userMsg = taskType === 'understand'
    ? buildUnderstandPrompt(input, selectedLanguage, schema)
    : buildPreparePrompt(input, selectedLanguage, schema);

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: DEFAULT_GROQ_MODEL,
      messages: [
        { role: 'system', content: buildSystemPrompt(selectedLanguage) },
        { role: 'user',   content: userMsg }
      ],
      temperature: 0.2,
      max_tokens: 4000
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error?.message || `Groq error ${res.status}`);
    err.status = 502; err.code = 'AI_OUTPUT_FAILED';
    err.publicMessage = 'We could not generate output right now. Please try again.';
    throw err;
  }

  const text   = data.choices?.[0]?.message?.content || '';
  const parsed = parseJson(text);
  return normalizeHealthOutput(parsed, taskType, selectedLanguage, text);
}

async function translateUiStrings({ strings, selectedLanguage, groqApiKey }) {
  const systemPrompt = `You translate website text for ClearCare, a healthcare app. Translate into ${selectedLanguage.instructionName}. Keep "ClearCare" unchanged. Keep numbers, URLs, phone numbers unchanged. Return ONLY valid JSON: {"translations":{"original":"translated"}}. Keys must exactly match originals. No markdown.`;

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: DEFAULT_GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: `Translate: ${JSON.stringify(strings)}` }
      ],
      temperature: 0.1,
      max_tokens: 5000
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`Groq translation error ${res.status}`);
    err.status = 502; err.code = 'UI_TRANSLATION_FAILED'; throw err;
  }

  const text   = data.choices?.[0]?.message?.content || '';
  const parsed = parseJson(text);
  const raw    = parsed?.translations && typeof parsed.translations === 'object' ? parsed.translations : parsed;

  return strings.reduce((out, src) => {
    out[src] = typeof raw?.[src] === 'string' ? raw[src].trim() : src;
    return out;
  }, {});
}

/* ── Prompt builders ── */

function buildSystemPrompt(lang) {
  return [
    'You are ClearCare, a healthcare access assistant.',
    `Write entirely in ${lang.instructionName}.`,
    'Explain healthcare information in plain language for a patient or family member.',
    'Do not diagnose, prescribe, or claim certainty.',
    'Encourage consulting a licensed clinician.',
    'For emergencies, say to call 911 or local emergency services.',
    'Use a calm, simple, culturally respectful tone.',
    'Return only valid JSON. No markdown wrapping.'
  ].join(' ');
}

function buildUnderstandPrompt(input, lang, schema) {
  const source = input.documentText
    ? `Medical document:\n${input.documentText}`
    : 'The user uploaded a medical document image.';
  return `Task: Explain this medical document in ${lang.instructionName}. Plain language, simple reading level. Keep key English medical terms in parentheses when helpful. Do not invent details.\n\nReturn JSON with exactly these keys: ${schema}\n\n${source}`;
}

function buildPreparePrompt(input, lang, schema) {
  return [
    `Task: Build an appointment prep kit in ${lang.instructionName}. Practical and easy to read. Do not diagnose.`,
    `Return JSON with exactly these keys: ${schema}`,
    `Condition: ${input.condition}`,
    `Appointment type: ${input.appointmentType || 'Not specified'}`,
    `Medications: ${input.medications || 'Not provided'}`,
    `Symptoms: ${input.symptoms || 'Not provided'}`
  ].join('\n\n');
}

/* ── Geocoding ── */

async function geocodeLocation(input, env) {
  const query = String(input || '').trim();
  if (!query) return null;

  const key = `geocode:${query.toLowerCase()}`;
  const hit  = getCached(key);
  if (hit !== undefined) return hit;

  const result =
    await geocodeZip(query).catch(() => null) ||
    await geocodeCensus(query).catch(() => null) ||
    await geocodeNominatim(query, env).catch(() => null);

  setCached(key, result);
  return result;
}

async function geocodeZip(query) {
  const m = query.match(/^\s*(\d{5})(?:-\d{4})?\s*$/);
  if (!m) return null;
  const res  = await fetch(`${ZIPPOPOTAMUS_URL}/${m[1]}`, { headers: { 'User-Agent': APP_USER_AGENT } });
  if (!res.ok) return null;
  const data  = await res.json();
  const place = data.places?.[0];
  const lat   = Number(place?.latitude);
  const lng   = Number(place?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { label: [data['post code'], place['place name'], place['state abbreviation']].filter(Boolean).join(', '), lat, lng, source: 'ZIP lookup' };
}

async function geocodeCensus(query) {
  const params = new URLSearchParams({ address: query, benchmark: 'Public_AR_Current', format: 'json' });
  const res    = await fetch(`${CENSUS_GEOCODER_URL}?${params}`, { headers: { 'User-Agent': APP_USER_AGENT } });
  if (!res.ok) return null;
  const data   = await res.json();
  const match  = data.result?.addressMatches?.[0];
  const coords = match?.coordinates;
  if (!coords || !Number.isFinite(coords.x) || !Number.isFinite(coords.y)) return null;
  return { label: match.matchedAddress || query, lat: coords.y, lng: coords.x, source: 'Census' };
}

async function geocodeNominatim(query, env) {
  await throttleNominatim();
  const params = new URLSearchParams({ q: query, format: 'jsonv2', countrycodes: 'us', limit: '1', addressdetails: '1' });
  if (env.NOMINATIM_CONTACT_EMAIL) params.set('email', env.NOMINATIM_CONTACT_EMAIL);
  const res  = await fetch(`${NOMINATIM_SEARCH_URL}?${params}`, { headers: { 'User-Agent': APP_USER_AGENT } });
  if (!res.ok) return null;
  const data = await res.json();
  const m    = data[0];
  if (!m) return null;
  const lat = Number(m.lat), lng = Number(m.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { label: m.display_name || query, lat, lng, source: 'OpenStreetMap' };
}

/* ── Provider search ── */

async function searchNearbyCare({ lat, lng, radiusMiles, careType, env }) {
  const key    = `search:${lat.toFixed(4)}:${lng.toFixed(4)}:${radiusMiles}:${careType}`;
  const cached = getCached(key);
  if (cached !== undefined) return cached;

  const config  = CARE_SEARCHES[careType] || CARE_SEARCHES.all;
  const tasks   = [searchOSM({ lat, lng, radiusMiles, careType, config })];
  if (config.includeHrsa && env.HRSA_API_TOKEN) tasks.push(searchHrsa({ lat, lng, radiusMiles, token: env.HRSA_API_TOKEN }));

  const settled = await Promise.allSettled(tasks);
  const results = settled
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .filter(r => Number.isFinite(r.distanceMiles) && r.distanceMiles <= radiusMiles);

  const unique = dedupeResults(results).sort((a, b) => a.distanceMiles - b.distanceMiles).slice(0, MAX_RESULTS);
  setCached(key, unique);
  return unique;
}

async function searchOSM({ lat, lng, radiusMiles, careType, config }) {
  const radiusMeters = Math.round(radiusMiles * 1609.344);
  const parts = [];
  for (const [key, vals] of config.osmFilters) {
    for (const t of ['node', 'way', 'relation']) {
      parts.push(`${t}["${key}"~"^(${vals})$",i](around:${radiusMeters},${lat},${lng});`);
    }
  }
  const query = `[out:json][timeout:25];(${parts.join('')});out center tags ${MAX_RESULTS * 3};`;

  const res  = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': APP_USER_AGENT },
    body: new URLSearchParams({ data: query }).toString()
  });
  if (!res.ok) throw new Error(`OSM error ${res.status}`);

  const data = await res.json();
  return (data.elements || [])
    .map(el => normalizeOSM(el, { lat, lng }, config.label))
    .filter(r => r && matchesCareType(r, careType, config));
}

async function searchHrsa({ lat, lng, radiusMiles, token }) {
  const res = await fetch(HRSA_HEALTH_CENTERS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': APP_USER_AGENT },
    body: JSON.stringify({ Latitude: lat, Longitude: lng, Radius: radiusMiles, MinRecs: 0, MaxRadius: radiusMiles, Token: token })
  });
  if (!res.ok) throw new Error(`HRSA error ${res.status}`);
  const data = await res.json();
  return (data.HCC || []).map(site => normalizeHrsa(site, { lat, lng })).filter(Boolean);
}

function normalizeOSM(el, origin, fallbackType) {
  const tags = el.tags || {};
  const lat  = el.lat ?? el.center?.lat;
  const lng  = el.lon ?? el.center?.lon;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const address = [
    [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' '),
    tags['addr:city'] || tags['addr:town'],
    tags['addr:state'],
    tags['addr:postcode']
  ].filter(Boolean).join(', ');

  return {
    id:           `osm-${el.type}-${el.id}`,
    name:         firstNonEmpty(tags.name, tags['official_name'], tags.operator, fallbackType),
    type:         inferOSMType(tags, fallbackType),
    category:     readableType(firstNonEmpty(tags.healthcare, tags.amenity, fallbackType)),
    distanceMiles: distanceMiles(origin.lat, origin.lng, lat, lng),
    address:      address || 'Address not available',
    phone:        firstNonEmpty(tags.phone, tags['contact:phone'], tags['contact:mobile']),
    website:      normalizeWebsite(firstNonEmpty(tags.website, tags['contact:website'], tags.url)),
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
    hoursText:    tags.opening_hours ? `Hours: ${tags.opening_hours}` : 'Call to confirm hours',
    source:       'OpenStreetMap',
    disclaimer:   'Call ahead to confirm services, cost, and hours.',
    searchText:   Object.values(tags).join(' ').toLowerCase()
  };
}

function normalizeHrsa(site, origin) {
  const parts = String(site.LAT_LON || '').trim().split(/\s+/).map(Number);
  const lat   = parts[0], lng = parts[1];
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const address = [site.SITE_ADDRESS, site.SITE_CITY, site.SITE_STATE_ABBR, site.SITE_ZIP_CD].filter(Boolean).join(', ');
  return {
    id:           `hrsa-${site.HCC_FCT_ID || site.Row_ID || `${lat}-${lng}`}`,
    name:         firstNonEmpty(site.SITE_NM, 'HRSA Health Center'),
    type:         'Low-cost/free care',
    category:     firstNonEmpty(site.HCC_TYP_DESC, 'Health center'),
    distanceMiles: Number(site.Distance) || distanceMiles(origin.lat, origin.lng, lat, lng),
    address:      address || 'Address not available',
    phone:        firstNonEmpty(site.SITE_PHONE_NUM),
    website:      normalizeWebsite(firstNonEmpty(site.SITE_URL)),
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
    hoursText:    'Call to confirm hours',
    source:       'HRSA Health Center Data',
    disclaimer:   'Call ahead to confirm services, cost, and hours.'
  };
}

function inferOSMType(tags, fallback) {
  const a = String(tags.amenity || '').toLowerCase();
  const h = String(tags.healthcare || '').toLowerCase();
  const all = Object.values(tags).join(' ').toLowerCase();
  if (a === 'pharmacy' || h === 'pharmacy') return 'Pharmacy';
  if (a === 'hospital' || h === 'hospital') return 'Hospital';
  if (all.includes('urgent') || all.includes('walk-in')) return 'Urgent care';
  if (all.includes('mental') || all.includes('behavioral') || h === 'psychotherapist') return 'Mental health';
  if (all.includes('free') || all.includes('fqhc') || all.includes('sliding')) return 'Low-cost/free care';
  if (a === 'doctors' || h === 'doctor') return 'Doctor';
  if (a === 'clinic' || h === 'clinic') return 'Clinic';
  return fallback || 'Care resource';
}

function matchesCareType(result, careType, config) {
  if (!config.textTerms?.length) return true;
  const hay = `${result.name} ${result.category} ${result.type} ${result.searchText || ''}`.toLowerCase();
  return config.textTerms.some(term => hay.includes(term));
}

/* ── Input normalization ── */

function normalizeHealthTaskType(v) { return v === 'prepare' ? 'prepare' : 'understand'; }

function normalizeHealthInput(raw, taskType) {
  const input = raw && typeof raw === 'object' ? raw : {};
  if (taskType === 'prepare') {
    const condition = String(input.condition || '').trim().slice(0, 800);
    if (!condition) return null;
    return {
      condition,
      appointmentType: String(input.appointmentType || '').trim().slice(0, 200),
      medications:     String(input.medications || '').trim().slice(0, 1500),
      symptoms:        String(input.symptoms || '').trim().slice(0, 2500)
    };
  }
  const documentText = String(input.documentText || '').trim().slice(0, MAX_HEALTH_INPUT_CHARS);
  const fileDataUrl  = normalizeImageDataUrl(input.fileDataUrl);
  if (!documentText && !fileDataUrl) return null;
  return { documentText, fileDataUrl, fileName: String(input.fileName || '').trim().slice(0, 200) };
}

function normalizeImageDataUrl(v) {
  const s = String(v || '').trim();
  if (!s || s.length > MAX_IMAGE_DATA_URL_CHARS) return '';
  if (!/^data:image\/(png|jpe?g|webp);base64,/i.test(s)) return '';
  return s;
}

function normalizeUiStrings(v) {
  if (!Array.isArray(v)) return [];
  return [...new Set(
    v.map(s => String(s || '').replace(/\s+/g, ' ').trim())
     .filter(s => s.length > 1 && s.length <= MAX_UI_TRANSLATION_CHARS)
  )].slice(0, MAX_UI_TRANSLATION_STRINGS);
}

function normalizeHealthOutput(parsed, taskType, lang, rawText) {
  const fallback = String(rawText || '').trim();
  const safe = s => (fallback.startsWith('{') ? '' : fallback) || '';

  if (taskType === 'prepare') {
    return {
      appointmentSummary:        strField(parsed?.appointmentSummary,        safe()),
      topQuestionsToAsk:         arrField(parsed?.topQuestionsToAsk),
      symptomsDetailsToMention:  arrField(parsed?.symptomsDetailsToMention),
      medicationsDocumentsToBring: arrField(parsed?.medicationsDocumentsToBring),
      redFlagsToRaise:           arrField(parsed?.redFlagsToRaise),
      disclaimer:                strField(parsed?.disclaimer, defaultDisclaimer())
    };
  }
  return {
    simpleSummary:       strField(parsed?.simpleSummary,       safe()),
    whatThisMightMean:   strField(parsed?.whatThisMightMean,   ''),
    importantInstructions: arrField(parsed?.importantInstructions),
    questionsToAskDoctor:  arrField(parsed?.questionsToAskDoctor),
    whenToSeekUrgentHelp:  arrField(parsed?.whenToSeekUrgentHelp),
    disclaimer:            strField(parsed?.disclaimer, defaultDisclaimer())
  };
}

function defaultDisclaimer() {
  return 'ClearCare is not medical advice and does not diagnose conditions. Contact a licensed clinician. For emergencies, call 911.';
}

function strField(v, fallback) { const s = String(v || '').trim(); return s || fallback || ''; }
function arrField(v) {
  if (!Array.isArray(v)) return [];
  return v.map(s => String(s || '').trim()).filter(Boolean).slice(0, 8);
}

/* ── Utilities ── */

function normalizeRadiusMiles(v) { const n = Number(v); return [5, 10, 25, 50].includes(n) ? n : 25; }
function normalizeCareType(v) { return CARE_SEARCHES[v] ? v : 'all'; }

function normalizeCoordinateLocation(p) {
  const lat = Number(p.lat), lng = Number(p.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { label: p.locationLabel || 'your current location', lat, lng, source: 'Browser location' };
}

function dedupeResults(results) {
  const map = new Map();
  for (const r of results) {
    const k = `${norm(r.name)}|${norm(r.address)}`;
    const e = map.get(k);
    if (!e || rank(r.source) > rank(e.source)) map.set(k, r);
  }
  return [...map.values()];
}

function rank(s) { if (s === 'HRSA Health Center Data') return 2; if (s === 'OpenStreetMap') return 1; return 0; }
function norm(v) { return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ''); }

function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

function readableType(t) {
  return String(t || '').split(/[_\s]+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

function firstNonEmpty(...vals) { return vals.find(v => typeof v === 'string' && v.trim())?.trim() || ''; }
function normalizeWebsite(v) {
  const s = String(v || '').trim();
  if (!s || s === '[No Data]') return '';
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

function parseJson(text) {
  const cleaned = String(text || '').replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  if (!cleaned) return null;
  try { return JSON.parse(cleaned); } catch {}
  const a = cleaned.indexOf('{'), b = cleaned.lastIndexOf('}');
  if (a === -1 || b <= a) return null;
  try { return JSON.parse(cleaned.slice(a, b + 1)); } catch { return null; }
}

async function throttleNominatim() {
  const wait = 1100 - (Date.now() - lastNominatimRequestAt);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastNominatimRequestAt = Date.now();
}

function getCached(key) {
  const e = cache.get(key);
  if (!e) return undefined;
  if (Date.now() - e.at > CACHE_TTL_MS) { cache.delete(key); return undefined; }
  return e.value;
}
function setCached(key, value) { cache.set(key, { at: Date.now(), value }); }

function getGroqApiKey(env) { return String(env.GROQ_API_KEY || '').trim(); }

function jsonResponse(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders({ 'Content-Type': 'application/json; charset=utf-8', ...extra })
  });
}

function corsHeaders(extra = {}) {
  return { ...extra, 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
}
