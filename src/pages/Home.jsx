import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslate } from '../hooks/useTranslate';

const STRINGS = [
  'Healthcare, finally in plain language',
  'Upload a medical document. Prepare for your appointment. Find free care near you — in any language, for anyone.',
  'Start for free', 'See how it works', 'No account required', 'Always free', '10+ languages',
  'How it works', 'From confused to confident in three steps',
  'Upload any medical document', 'Discharge papers, lab results, prescriptions — take a photo or upload a PDF. ClearCare reads it and turns everything into clear, plain language.',
  'Try it now', 'Get your appointment prep kit', 'Tell us your condition and the type of visit. Get questions to ask your doctor, a symptom summary to read aloud, and a checklist of what to bring.',
  'Build my prep kit', 'Find free care in your community', 'Search for free clinics, FQHCs, urgent care, and pharmacies near you. Filter by type of care and distance.',
  'Find care near me', 'Built for the people left behind', 'Who this is for',
  'Low-income families', 'Non-English speakers', 'Elderly individuals', 'Uninsured people', 'Rural communities',
  'Ready to make sense of your health?', 'No jargon. No cost. No barriers.', 'Get started free', 'Learn more',
  'Americans with low health literacy', 'Languages fully supported', 'Cost to use ClearCare, forever', 'Free clinics in our database'
];

export default function Home() {
  const t = useTranslate(STRINGS);
  const revealRef = useRef(null);

  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('reveal--visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const nums = document.querySelectorAll('.stat-num[data-target]');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.dataset.target);
        const prefix = el.dataset.prefix || '';
        if (target === 0) { el.textContent = prefix + '0'; return; }
        const start = performance.now();
        const tick = now => {
          const p = Math.min((now - start) / 1800, 1);
          el.textContent = prefix + Math.round((1 - Math.pow(1 - p, 3)) * target).toLocaleString();
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    }, { threshold: 0.3 });
    nums.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <main>
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          <div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/>
          <div className="grid-overlay"/>
        </div>
        <div className="hero-inner container">
          <div className="hero-content reveal">
            <div className="hero-badge">
              <span className="badge-dot"/>
              Congressional App Challenge 2026
            </div>
            <h1 className="hero-title">
              {t('Healthcare, finally in plain language')}
            </h1>
            <p className="hero-sub">
              {t('Upload a medical document. Prepare for your appointment. Find free care near you — in any language, for anyone.')}
            </p>
            <div className="hero-actions">
              <Link to="/onboarding" className="btn btn-primary btn-lg">
                {t('Start for free')}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <a href="#how" className="btn btn-glass btn-lg">{t('See how it works')}</a>
            </div>
            <div className="hero-trust">
              {[t('No account required'), t('Always free'), t('10+ languages')].map((item, i) => (
                <span key={i} className="trust-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  {item}
                  {i < 2 && <span className="trust-dot"/>}
                </span>
              ))}
            </div>
          </div>
          <div className="hero-visual reveal reveal--delay">
            <DemoCard />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats" id="stats">
        <div className="container">
          <div className="stats-grid">
            <StatItem target={36} suffix="million"  label={t('Americans with low health literacy')} />
            <div className="stat-divider"/>
            <StatItem target={10} suffix="+"        label={t('Languages fully supported')} />
            <div className="stat-divider"/>
            <StatItem target={0}  prefix="$"        label={t('Cost to use ClearCare, forever')} />
            <div className="stat-divider"/>
            <StatItem target={1400} suffix="+"      label={t('Free clinics in our database')} />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how" id="how">
        <div className="container">
          <div className="section-eyebrow reveal">{t('How it works')}</div>
          <h2 className="section-title reveal">{t('From confused to confident in three steps')}</h2>
          <div className="steps">
            <StepItem num="01" color="blue" to="/understand" tag="Understand"
              title={t('Upload any medical document')}
              desc={t('Discharge papers, lab results, prescriptions — take a photo or upload a PDF. ClearCare reads it and turns everything into clear, plain language.')}
              cta={t('Try it now')} />
            <div className="step-connector reveal"/>
            <StepItem num="02" color="teal" to="/prepare" tag="Prepare" reverse
              title={t('Get your appointment prep kit')}
              desc={t('Tell us your condition and the type of visit. Get questions to ask your doctor, a symptom summary to read aloud, and a checklist of what to bring.')}
              cta={t('Build my prep kit')} />
            <div className="step-connector reveal"/>
            <StepItem num="03" color="soft" to="/connect" tag="Connect"
              title={t('Find free care in your community')}
              desc={t('Search for free clinics, FQHCs, urgent care, and pharmacies near you. Filter by type of care and distance.')}
              cta={t('Find care near me')} />
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="audience">
        <div className="container">
          <div className="section-eyebrow section-eyebrow--light reveal">{t('Who this is for')}</div>
          <h2 className="section-title section-title--light reveal">{t('Built for the people left behind')}</h2>
          <div className="audience-cards">
            {[
              { icon: '👨‍👩‍👧', title: t('Low-income families'),   desc: 'Find sliding-scale care, understand assistance programs, and avoid costly ER visits.' },
              { icon: '🌍', title: t('Non-English speakers'),    desc: 'The full experience in your language — not a translation button added as an afterthought.' },
              { icon: '❤️', title: t('Elderly individuals'),     desc: 'Large text, simple navigation, and a warm interface that treats you with dignity.' },
              { icon: '🏥', title: t('Uninsured people'),         desc: 'No navigator, no idea what anything costs? ClearCare shows you what you can access right now.' },
              { icon: '🌾', title: t('Rural communities'),        desc: 'Telehealth options and verified resources for people where distance is a real barrier.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="audience-card reveal">
                <div className="audience-icon">{icon}</div>
                <div className="audience-card-title">{title}</div>
                <div className="audience-card-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container cta-inner reveal">
          <div className="cta-badge">Free · No account needed</div>
          <h2 className="cta-title">{t('Ready to make sense of your health?')}</h2>
          <p className="cta-sub">{t('No jargon. No cost. No barriers.')}</p>
          <div className="cta-actions">
            <Link to="/onboarding" className="btn btn-white btn-lg">
              {t('Get started free')}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link to="/about" className="btn btn-glass-light btn-lg">{t('Learn more')}</Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function StatItem({ target, suffix = '', prefix = '', label }) {
  return (
    <div className="stat-item reveal">
      <span className="stat-num" data-target={target} data-prefix={prefix}>{prefix}0</span>
      {suffix && <span className="stat-suffix">{suffix}</span>}
      <div className="stat-label">{label}</div>
    </div>
  );
}

function StepItem({ num, color, to, tag, title, desc, cta, reverse }) {
  return (
    <div className={`step-item reveal${reverse ? ' step-item--reverse' : ''}`}>
      <div className={`step-visual step-visual--${color}`}>
        <div className="step-num">{num}</div>
        <div className="step-glow"/>
      </div>
      <div className="step-content">
        <div className={`step-tag step-tag--${color}`}>{tag}</div>
        <h3>{title}</h3>
        <p>{desc}</p>
        <Link to={to} className={`step-link step-link--${color}`}>
          {cta}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </div>
    </div>
  );
}

function DemoCard() {
  return (
    <div className="demo-card">
      <div className="demo-card-top">
        <div className="demo-file-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div className="demo-file-info">
          <div className="demo-file-name">Discharge_Summary.pdf</div>
          <div className="demo-file-meta">St. Mary's Hospital · 3 pages</div>
        </div>
        <div className="demo-status">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          Done
        </div>
      </div>
      <div className="demo-result">
        <div className="demo-result-header">
          <span className="demo-result-icon">✦</span>
          <span className="demo-result-label">Plain language summary</span>
        </div>
        <p className="demo-result-text">
          Your blood pressure was high during your visit. The doctor wants you to take one white pill every morning with food and return in 2 weeks.
        </p>
        <div className="demo-chips">
          <span className="chip chip-warn">⚠ Watch for dizziness</span>
          <span className="chip chip-ok">📅 Follow-up: June 3</span>
        </div>
      </div>
      <div className="float-card float-card-1">
        <span>🌎</span>
        <span>Available in <strong>10+ languages</strong></span>
      </div>
      <div className="float-card float-card-2">
        <span>🔒</span>
        <span>Private &amp; <strong>secure</strong></span>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="nav-logo">
              <div className="logo-mark">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2L9 16M2 9L16 9" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="logo-text">ClearCare</span>
            </Link>
            <p className="footer-tagline">Healthcare in plain language,<br/>for everyone.</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <div className="footer-col-title">Features</div>
              <Link to="/understand">Understand</Link>
              <Link to="/prepare">Prepare</Link>
              <Link to="/connect">Connect</Link>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Project</div>
              <Link to="/about">About</Link>
              <Link to="/onboarding">Get started</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>Built for the Congressional App Challenge 2026 · Free forever · Not a medical provider</p>
        </div>
      </div>
    </footer>
  );
}
