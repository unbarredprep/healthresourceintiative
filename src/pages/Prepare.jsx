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
  { key: 'questionsToAsk',     label: 'Questions to ask your doctor',  icon: '❓', accent: 'blue' },
  { key: 'symptomsToDescribe', label: 'How to describe your symptoms', icon: '🗣', accent: 'teal' },
  { key: 'whatToBring',        label: 'What to bring',                 icon: '🎒', accent: 'soft' },
  { key: 'importantReminders', label: 'Important reminders',           icon: '📌', accent: 'amber' },
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

    const input = `Condition: ${condition.trim()}\nVisit type: ${visitType}${symptoms.trim() ? `\nSymptoms: ${symptoms.trim()}` : ''}`;

    try {
      const data = await getHealthOutput({ taskType: 'prepare', language: language.code, input });
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
                <span className="result-badge">✦ ClearCare</span>
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
