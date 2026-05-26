import { useState, useRef, useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useTranslate } from '../hooks/useTranslate';
import { getHealthOutput } from '../api';

const STRINGS = [
  'Understand Your Medical Documents',
  'Upload a medical document or paste text — ClearCare will explain it in plain language.',
  'Upload a file', 'Drag & drop a PDF, image, or text file, or click to browse',
  'Supported: PDF, JPG, PNG, TXT', 'Or paste your text below',
  'Paste discharge notes, lab results, or any medical text here…',
  'Explain this document', 'Analyzing your document…',
  'What this says in plain language', 'What this might mean',
  'Important instructions', 'Questions to ask your doctor',
  'When to seek urgent help', 'Start over', 'Print results',
  'This is not medical advice. Always consult a qualified healthcare provider.',
  'Remove file', 'File ready', 'Choose a different file',
  'Tips for best results',
  'Photographed documents work best in good lighting',
  'For lab results, include the full page with reference ranges',
  'You can paste text directly if typing is easier',
];

const RESULT_SECTIONS = [
  { key: 'simpleSummary',          label: 'What this says in plain language', icon: '📋', accent: 'blue' },
  { key: 'whatThisMightMean',      label: 'What this might mean',             icon: '💡', accent: 'teal' },
  { key: 'importantInstructions',  label: 'Important instructions',           icon: '📌', accent: 'amber' },
  { key: 'questionsToAskDoctor',   label: 'Questions to ask your doctor',     icon: '🩺', accent: 'soft' },
  { key: 'whenToSeekUrgentHelp',   label: 'When to seek urgent help',         icon: '🚨', accent: 'red'  },
];

export default function Understand() {
  const { language } = useLanguage();
  const t = useTranslate(STRINGS);

  const [file,    setFile]    = useState(null);
  const [text,    setText]    = useState('');
  const [drag,    setDrag]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState('');
  const inputRef  = useRef(null);
  const resultRef = useRef(null);
  const abortRef  = useRef(null);

  const handleFile = useCallback(f => {
    if (!f) return;
    const ok = ['application/pdf','image/jpeg','image/png','text/plain'].includes(f.type) ||
               f.name.match(/\.(pdf|jpg|jpeg|png|txt)$/i);
    if (!ok) { setError('Please upload a PDF, image, or text file.'); return; }
    if (f.size > 10 * 1024 * 1024) { setError('File is too large (max 10 MB).'); return; }
    setFile(f); setError('');
  }, []);

  const onDrop = useCallback(e => {
    e.preventDefault(); setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  async function fileToText(f) {
    if (f.type === 'text/plain' || f.name.endsWith('.txt')) {
      return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsText(f);
      });
    }
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(f);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const input = file ? await fileToText(file) : text.trim();
    if (!input) { setError('Please upload a file or paste some text.'); return; }

    setLoading(true); setResult(null);
    abortRef.current = new AbortController();

    try {
      const data = await getHealthOutput(
        { taskType: 'understand', language: language.code, input },
        abortRef.current.signal
      );
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null); setText(''); setResult(null); setError('');
    abortRef.current?.abort();
  }

  return (
    <main className="page-main">
      <div className="page-hero page-hero--understand">
        <div className="container">
          <div className="page-hero-tag">Understand</div>
          <h1>{t('Understand Your Medical Documents')}</h1>
          <p>{t('Upload a medical document or paste text — ClearCare will explain it in plain language.')}</p>
        </div>
      </div>

      <div className="container page-body">
        <div className="understand-layout">
          {/* INPUT PANEL */}
          {!result && (
            <form className="input-panel" onSubmit={handleSubmit}>
              {/* DROP ZONE */}
              <div
                className={`drop-zone${drag ? ' drop-zone--drag' : ''}${file ? ' drop-zone--filled' : ''}`}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={onDrop}
                onClick={() => !file && inputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && !file && inputRef.current?.click()}
                aria-label={t('Upload a file')}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.txt"
                  className="visually-hidden"
                  onChange={e => handleFile(e.target.files[0])}
                />
                {file ? (
                  <div className="drop-zone-filled">
                    <span className="drop-file-icon">📄</span>
                    <div className="drop-file-info">
                      <span className="drop-file-name">{file.name}</span>
                      <span className="drop-file-size">{(file.size / 1024).toFixed(0)} KB · {t('File ready')}</span>
                    </div>
                    <button type="button" className="drop-remove" onClick={e => { e.stopPropagation(); setFile(null); }} aria-label={t('Remove file')}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ) : (
                  <div className="drop-zone-empty">
                    <div className="drop-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <div className="drop-label">{t('Upload a file')}</div>
                    <div className="drop-hint">{t('Drag & drop a PDF, image, or text file, or click to browse')}</div>
                    <div className="drop-types">{t('Supported: PDF, JPG, PNG, TXT')}</div>
                  </div>
                )}
              </div>

              {/* DIVIDER */}
              <div className="input-divider"><span>{t('Or paste your text below')}</span></div>

              {/* TEXTAREA */}
              <textarea
                className="doc-textarea"
                rows={7}
                placeholder={t('Paste discharge notes, lab results, or any medical text here…')}
                value={text}
                onChange={e => setText(e.target.value)}
                disabled={!!file}
              />

              {error && <div className="input-error">{error}</div>}

              <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading || (!file && !text.trim())}>
                {loading ? (
                  <><span className="btn-spinner"/>{t('Analyzing your document…')}</>
                ) : (
                  <>{t('Explain this document')}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                )}
              </button>

              {/* TIPS */}
              <details className="tips-box">
                <summary>{t('Tips for best results')}</summary>
                <ul>
                  <li>{t('Photographed documents work best in good lighting')}</li>
                  <li>{t('For lab results, include the full page with reference ranges')}</li>
                  <li>{t('You can paste text directly if typing is easier')}</li>
                </ul>
              </details>
            </form>
          )}

          {/* RESULT PANEL */}
          {result && (
            <div className="result-panel" ref={resultRef}>
              <div className="result-header">
                <div className="result-header-left">
                  <span className="result-badge">✦ ClearCare</span>
                  <h2>Your plain-language summary</h2>
                </div>
                <div className="result-header-actions">
                  <button className="btn btn-ghost" onClick={() => window.print()}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    {t('Print results')}
                  </button>
                  <button className="btn btn-ghost" onClick={reset}>
                    {t('Start over')}
                  </button>
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
