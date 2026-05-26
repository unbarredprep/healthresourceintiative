import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import LangModal from './LangModal';

const NAV_LINKS = [
  { to: '/understand', label: 'Understand' },
  { to: '/prepare',    label: 'Prepare' },
  { to: '/connect',    label: 'Connect' },
  { to: '/about',      label: 'About' },
];

export default function Nav() {
  const { pathname } = useLocation();
  const { language }  = useLanguage();
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [langOpen,    setLangOpen]    = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <>
      <nav className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
        <div className="nav-inner">
          <Link to="/" className="nav-logo">
            <div className="logo-mark">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L9 16M2 9L16 9" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="logo-text">ClearCare</span>
          </Link>

          <div className="nav-links">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} className={`nav-link${pathname === to ? ' nav-link--active' : ''}`}>
                {label}
              </Link>
            ))}
          </div>

          <div className="nav-right">
            <button className="lang-btn" onClick={() => setLangOpen(true)} aria-label="Change language">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              {language.code.toUpperCase()}
            </button>
            <Link to="/onboarding" className="btn btn-primary">Get started</Link>
          </div>

          <button className="hamburger" onClick={() => setMobileOpen(v => !v)} aria-label="Toggle menu">
            <span/><span/><span/>
          </button>
        </div>

        {mobileOpen && (
          <div className="mobile-nav">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to}>{label}</Link>
            ))}
            <button type="button" onClick={() => { setMobileOpen(false); setLangOpen(true); }}>Language</button>
            <Link to="/onboarding" className="btn btn-primary">Get started</Link>
          </div>
        )}
      </nav>

      {langOpen && <LangModal onClose={() => setLangOpen(false)} />}
    </>
  );
}
