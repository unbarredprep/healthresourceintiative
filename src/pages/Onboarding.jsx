import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';

const STEPS = ['welcome', 'language', 'choose'];

export default function Onboarding() {
  const { language, languages, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  function pickLang(code) {
    setLanguage(code);
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1);
  }

  function back() {
    if (step > 0) setStep(s => s - 1);
  }

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        {/* HEADER */}
        <div className="onboarding-header">
          <Link to="/" className="nav-logo onboarding-logo">
            <div className="logo-mark">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L9 16M2 9L16 9" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="logo-text">ClearCare</span>
          </Link>
          <div className="onboarding-steps">
            {STEPS.map((_, i) => (
              <div key={i} className={`onboarding-step-dot${i <= step ? ' onboarding-step-dot--active' : ''}`}/>
            ))}
          </div>
        </div>

        {/* WELCOME */}
        {step === 0 && (
          <div className="onboarding-body">
            <div className="onboarding-icon-big">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h1>Welcome to ClearCare</h1>
            <p>
              ClearCare helps you understand your health — without jargon, without cost, and in your language.
              It takes about 30 seconds to get started.
            </p>
            <ul className="onboarding-checklist">
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> No account required</li>
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> Works in 10 languages</li>
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> Always free</li>
            </ul>
            <button className="btn btn-primary btn-lg btn-full" onClick={next}>
              Get started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}

        {/* LANGUAGE */}
        {step === 1 && (
          <div className="onboarding-body">
            <h2>Choose your language</h2>
            <p>ClearCare will use this language across all features. You can change it anytime.</p>
            <div className="lang-grid lang-grid--onboard">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  className={`lang-option${language.code === lang.code ? ' lang-option--active' : ''}`}
                  onClick={() => pickLang(lang.code)}
                >
                  <span className="lang-native">{lang.nativeLabel}</span>
                  <span className="lang-english">{lang.label}</span>
                </button>
              ))}
            </div>
            <div className="onboarding-nav">
              <button className="btn btn-ghost" onClick={back}>Back</button>
              <button className="btn btn-primary btn-lg" onClick={next}>
                Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* CHOOSE FEATURE */}
        {step === 2 && (
          <div className="onboarding-body">
            <h2>What would you like to do?</h2>
            <p>You can always access all features from the top navigation.</p>
            <div className="onboard-features">
              <Link to="/understand" className="onboard-feature-card">
                <div className="onboard-feature-num">01</div>
                <div>
                  <strong>Understand a document</strong>
                  <p>Upload discharge papers, lab results, or prescriptions for a plain-language explanation.</p>
                </div>
                <svg className="onboard-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link to="/prepare" className="onboard-feature-card">
                <div className="onboard-feature-num">02</div>
                <div>
                  <strong>Prepare for an appointment</strong>
                  <p>Get a personalized prep kit with questions, symptom summaries, and what to bring.</p>
                </div>
                <svg className="onboard-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link to="/connect" className="onboard-feature-card">
                <div className="onboard-feature-num">03</div>
                <div>
                  <strong>Find free care near me</strong>
                  <p>Search for free clinics, FQHCs, urgent care, and pharmacies in your area.</p>
                </div>
                <svg className="onboard-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
            <div className="onboarding-nav">
              <button className="btn btn-ghost" onClick={back}>Back</button>
              <Link to="/" className="btn btn-ghost">Skip to home</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
