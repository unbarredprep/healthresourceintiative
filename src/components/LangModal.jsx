import { useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';

export default function LangModal({ onClose }) {
  const { language, languages, setLanguage } = useLanguage();

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  function pick(code) {
    setLanguage(code);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Choose your language">
        <div className="modal-header">
          <div className="modal-title">Choose your language</div>
          <button className="modal-x" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <p className="modal-subtitle">ClearCare will remember your choice on this device.</p>
        <div className="lang-grid">
          {languages.map(lang => (
            <button
              key={lang.code}
              type="button"
              className={`lang-option${language.code === lang.code ? ' lang-option--active' : ''}`}
              onClick={() => pick(lang.code)}
            >
              <span className="lang-native">{lang.nativeLabel}</span>
              <span className="lang-english">{lang.label}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-primary modal-done" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
