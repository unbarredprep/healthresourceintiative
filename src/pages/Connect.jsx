import { useState, useRef } from 'react';
import { useTranslate } from '../hooks/useTranslate';
import { searchConnect } from '../api';

const STRINGS = [
  'Find Free Care Near You',
  'Search for free clinics, FQHCs, urgent care, and pharmacies in your community.',
  'Address or ZIP code', 'Enter your address or ZIP code…',
  'Type of care', 'All types',
  'Free clinic', 'FQHC', 'Urgent care', 'Pharmacy', 'Mental health',
  'Distance', '5 miles', '10 miles', '25 miles', '50 miles',
  'Search for care', 'Searching…',
  'results found', 'No results found',
  "We couldn't find providers matching your search. Try a different ZIP or expand your distance.",
  'Call', 'Directions', 'Website', 'miles away',
  'Free', 'Sliding scale', 'Open now',
  'Search again',
];

const CARE_TYPES = [
  { value: '',               label: 'All types' },
  { value: 'free_clinic',    label: 'Free clinic' },
  { value: 'fqhc',           label: 'FQHC' },
  { value: 'urgent_care',    label: 'Urgent care' },
  { value: 'pharmacy',       label: 'Pharmacy' },
  { value: 'mental_health',  label: 'Mental health' },
];

const DISTANCES = ['5', '10', '25', '50'];

export default function Connect() {
  const t = useTranslate(STRINGS);

  const [query,      setQuery]      = useState('');
  const [careType,   setCareType]   = useState('');
  const [radius,     setRadius]     = useState('10');
  const [loading,    setLoading]    = useState(false);
  const [locating,   setLocating]   = useState(false);
  const [results,    setResults]    = useState(null);
  const [error,      setError]      = useState('');
  const abortRef = useRef(null);

  async function runSearch(params) {
    setError(''); setLoading(true); setResults(null);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const data = await searchConnect(params, abortRef.current.signal);
      setResults(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) { setError('Please enter an address or ZIP code.'); return; }
    runSearch({ locationQuery: query.trim(), careType, radiusMiles: parseInt(radius) });
  }

  function handleUseLocation() {
    if (!navigator.geolocation) { setError('Geolocation is not supported by your browser.'); return; }
    setLocating(true); setError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocating(false);
        setQuery('Current location');
        runSearch({ lat: pos.coords.latitude, lng: pos.coords.longitude, careType, radiusMiles: parseInt(radius) });
      },
      () => { setLocating(false); setError('Could not get your location. Please enter an address or ZIP code instead.'); }
    );
  }

  return (
    <main className="page-main">
      <div className="page-hero page-hero--connect">
        <div className="container">
          <div className="page-hero-tag">Connect</div>
          <h1>{t('Find Free Care Near You')}</h1>
          <p>{t('Search for free clinics, FQHCs, urgent care, and pharmacies in your community.')}</p>
        </div>
      </div>

      <div className="container page-body">
        <form className="connect-form" onSubmit={handleSubmit}>
          <div className="connect-form-main">
            <div className="form-field connect-query-field">
              <label className="form-label">{t('Address or ZIP code')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('Enter your address or ZIP code…')}
                value={query}
                onChange={e => setQuery(e.target.value)}
                required
              />
              <button type="button" className="loc-btn" onClick={handleUseLocation} disabled={locating || loading}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                {locating ? 'Locating…' : 'Use my location'}
              </button>
            </div>

            <div className="form-field">
              <label className="form-label">{t('Type of care')}</label>
              <div className="select-wrap">
                <select className="form-select" value={careType} onChange={e => setCareType(e.target.value)}>
                  {CARE_TYPES.map(ct => (
                    <option key={ct.value} value={ct.value}>{t(ct.label)}</option>
                  ))}
                </select>
                <svg className="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">{t('Distance')}</label>
              <div className="select-wrap">
                <select className="form-select" value={radius} onChange={e => setRadius(e.target.value)}>
                  {DISTANCES.map(d => (
                    <option key={d} value={d}>{t(`${d} miles`)}</option>
                  ))}
                </select>
                <svg className="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          </div>

          {error && <div className="input-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !query.trim()}>
            {loading ? (
              <><span className="btn-spinner"/>{t('Searching…')}</>
            ) : (
              <>{t('Search for care')}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></>
            )}
          </button>
        </form>

        {/* RESULTS */}
        {results !== null && (
          <div className="connect-results">
            {results.length > 0 ? (
              <>
                <div className="results-count">
                  <strong>{results.length}</strong> {t('results found')}
                </div>
                <div className="provider-list">
                  {results.map((p, i) => <ProviderCard key={i} provider={p} t={t} />)}
                </div>
              </>
            ) : (
              <div className="no-results">
                <div className="no-results-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <h3>{t('No results found')}</h3>
                <p>{t("We couldn't find providers matching your search. Try a different ZIP or expand your distance.")}</p>
                <button className="btn btn-secondary" onClick={() => setResults(null)}>{t('Search again')}</button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function ProviderCard({ provider, t }) {
  const {
    name, address, phone, website, distance, type,
    isFree, isSlidingScale, tags = []
  } = provider;

  const mapsUrl = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null;

  return (
    <div className="provider-card">
      <div className="provider-card-top">
        <div className="provider-info">
          <h3 className="provider-name">{name}</h3>
          {address && <p className="provider-address">{address}</p>}
          <div className="provider-tags">
            {type && <span className="ptag ptag--type">{type}</span>}
            {isFree && <span className="ptag ptag--free">{t('Free')}</span>}
            {isSlidingScale && <span className="ptag ptag--sliding">{t('Sliding scale')}</span>}
            {tags.map(tag => <span key={tag} className="ptag">{tag}</span>)}
          </div>
        </div>
        {distance != null && (
          <div className="provider-distance">{typeof distance === 'number' ? distance.toFixed(1) : distance} {t('miles away')}</div>
        )}
      </div>
      <div className="provider-actions">
        {phone && (
          <a href={`tel:${phone}`} className="btn btn-ghost btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.78-.78a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17z"/></svg>
            {t('Call')}
          </a>
        )}
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            {t('Directions')}
          </a>
        )}
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            {t('Website')}
          </a>
        )}
      </div>
    </div>
  );
}
