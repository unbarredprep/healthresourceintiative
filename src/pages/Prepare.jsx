import { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useTranslate } from '../hooks/useTranslate';
import { getHealthOutput } from '../api';

const STRINGS = [
  'Prepare for Your Appointment',
  'Tell us about your visit and get a personalized prep kit with questions, a symptom summary, and a checklist.',
  'What condition or concern are you dealing with?',
  'e.g. high blood pressure, knee pain, diabetes follow-up…',
  'Type of visit', 'Select visit type',
  'Primary care / Check-up', 'Specialist visit', 'Urgent care', 'Follow-up visit',
  'Mental health visit', 'Lab results review', 'Surgery consultation',
  'Any symptoms you want to mention? (optional)',
  'Describe any symptoms, changes, or concerns you want the doctor to know about…',
  'Build my prep kit', 'Building your prep kit…',
  'Questions to ask your doctor', 'How to describe your symptoms',
  'What to bring', 'Important reminders',
  'Start over', 'Print prep kit',
  'This is not medical advice. Always consult a qualified healthcare provider.',
  'Your personalized prep kit',
];

const VISIT_TYPES = [
  'Primary care / Check-up',
  'Specialist visit',
  'Urgent care',
  'Follow-up visit',
  'Mental health visit',
  'Lab results review',
  'Surgery consultation',
];

const RESULT_SECTIONS = [
  { key: 'topQuestionsToAsk',           label: 'Questions to ask your doctor',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, accent: 'blue' },
  { key: 'symptomsDetailsToMention',    label: 'How to describe your symptoms', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, accent: 'teal' },
  { key: 'medicationsDocumentsToBring', label: 'What to bring',                 icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, accent: 'soft' },
  { key: 'redFlagsToRaise',             label: 'Important reminders',           icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, accent: 'amber' },
];

export default function Prepare() {
  const { language } = useLanguage();
  const t = useTranslate(STRINGS);

  const [condition, setCondition] = useState('');
  const [visitType, setVisitType] = useState('');
  const [symptoms,  setSymptoms]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!condition.trim() || !visitType) {
      setError('Please fill in your condition and visit type.'); return;
    }
    setError(''); setLoading(true); setResult(null);

    try {
      const data = await getHealthOutput({
        taskType: 'prepare',
        language: language.code,
        input: { condition: condition.trim(), appointmentType: visitType, symptoms: symptoms.trim() }
      });
      setResult(data);
      setTimeout(() => document.getElementById('prep-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function reset() { setCondition(''); setVisitType(''); setSymptoms(''); setResult(null); setError(''); }

  return (
    <main className="page-main">
      <div className="page-hero page-hero--prepare">
        <div className="container">
          <div className="page-hero-tag">Prepare</div>
          <h1>{t('Prepare for Your Appointment')}</h1>
          <p>{t('Tell us about your visit and get a personalized prep kit with questions, a symptom summary, and a checklist.')}</p>
        </div>
      </div>

      <div className="container page-body">
        {!result ? (
          <form className="input-panel input-panel--narrow" onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label">{t('What condition or concern are you dealing with?')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('e.g. high blood pressure, knee pain, diabetes follow-up…')}
                value={condition}
                onChange={e => setCondition(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">{t('Type of visit')}</label>
              <div className="select-wrap">
                <select
                  className="form-select"
                  value={visitType}
                  onChange={e => setVisitType(e.target.value)}
                  required
                >
                  <option value="" disabled>{t('Select visit type')}</option>
                  {VISIT_TYPES.map(v => (
                    <option key={v} value={v}>{t(v)}</option>
                  ))}
                </select>
                <svg className="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">
                {t('Any symptoms you want to mention? (optional)')}
              </label>
              <textarea
                className="form-textarea"
                rows={5}
                placeholder={t('Describe any symptoms, changes, or concerns you want the doctor to know about…')}
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
              />
            </div>

            {error && <div className="input-error">{error}</div>}

            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading || !condition.trim() || !visitType}>
              {loading ? (
                <><span className="btn-spinner"/>{t('Building your prep kit…')}</>
              ) : (
                <>{t('Build my prep kit')}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
              )}
            </button>
          </form>
        ) : (
          <div className="result-panel" id="prep-result">
            <div className="result-header">
              <div className="result-header-left">
                <span className="result-badge">ClearCare</span>
                <h2>{t('Your personalized prep kit')}</h2>
                <p className="result-context">{condition} · {visitType}</p>
              </div>
              <div className="result-header-actions">
                <button className="btn btn-ghost" onClick={() => window.print()}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  {t('Print prep kit')}
                </button>
                <button className="btn btn-ghost" onClick={reset}>{t('Start over')}</button>
              </div>
            </div>

            {result.appointmentSummary && (
              <div className="result-section result-section--blue">
                <div className="result-section-header">
                  <span className="result-section-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </span>
                  <h3>Appointment overview</h3>
                </div>
                <p className="result-text">{result.appointmentSummary}</p>
              </div>
            )}
            {RESULT_SECTIONS.map(({ key, label, icon, accent }) =>
              result[key] ? (
                <div key={key} className={`result-section result-section--${accent}`}>
                  <div className="result-section-header">
                    <span className="result-section-icon">{icon}</span>
                    <h3>{t(label)}</h3>
                  </div>
                  <ResultContent value={result[key]} />
                </div>
              ) : null
            )}

            {result.disclaimer && (
              <div className="result-disclaimer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {t('This is not medical advice. Always consult a qualified healthcare provider.')}
              </div>
            )}

            <div className="result-actions">
              <button className="btn btn-secondary" onClick={reset}>{t('Start over')}</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ResultContent({ value }) {
  if (Array.isArray(value)) {
    return (
      <ul className="result-list">
        {value.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    );
  }
  return <p className="result-text">{value}</p>;
}
