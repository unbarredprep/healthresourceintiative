import { Link } from 'react-router-dom';

export default function About() {
  return (
    <main className="page-main">
      <div className="page-hero page-hero--about">
        <div className="container">
          <div className="page-hero-tag">About</div>
          <h1>Built to break down barriers in healthcare</h1>
          <p>ClearCare is a free health literacy tool created for the Congressional App Challenge 2026.</p>
        </div>
      </div>

      <div className="container page-body about-body">

        <section className="about-section">
          <h2>The problem</h2>
          <p>
            Over 36 million Americans have low health literacy — meaning they struggle to understand
            medical documents, follow instructions from their doctor, or navigate the healthcare system.
            This barrier falls hardest on low-income families, non-English speakers, elderly individuals,
            and uninsured people who already face the greatest obstacles to care.
          </p>
          <p>
            A discharge summary that a physician writes in three minutes can take a patient hours to
            understand — or be misunderstood entirely. When people can't understand their own health,
            they miss follow-ups, take medications incorrectly, and end up in the ER for preventable reasons.
          </p>
        </section>

        <section className="about-section">
          <h2>What ClearCare does</h2>
          <div className="about-features">
            <div className="about-feature">
              <div className="about-feature-num">01</div>
              <div>
                <h3>Understand</h3>
                <p>Upload any medical document — discharge papers, lab results, prescriptions — and get a plain-language explanation, key instructions, and questions to ask your doctor.</p>
              </div>
            </div>
            <div className="about-feature">
              <div className="about-feature-num">02</div>
              <div>
                <h3>Prepare</h3>
                <p>Enter your condition and visit type to get a personalized appointment prep kit: questions to ask, how to describe your symptoms, and a checklist of what to bring.</p>
              </div>
            </div>
            <div className="about-feature">
              <div className="about-feature-num">03</div>
              <div>
                <h3>Connect</h3>
                <p>Search for free clinics, FQHCs, urgent care centers, and pharmacies near you. Filter by type and distance to find the care you can actually access.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Our principles</h2>
          <div className="about-principles">
            {[
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, title: 'Private by design', desc: 'Documents you upload are processed and immediately discarded. Nothing is stored.' },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, title: 'Works in your language', desc: 'Every feature works in 10 languages — translated live, not just the UI.' },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, title: 'Always free', desc: 'No paywalls, no premium tier, no account required. This is a public service, not a product.' },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>, title: 'Works on any device', desc: 'Designed to work on a phone with a slow connection. No app download required.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="about-principle">
                <div className="about-principle-icon">{icon}</div>
                <div>
                  <strong>{title}</strong>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section about-section--cta">
          <h2>Try it for yourself</h2>
          <p>ClearCare is completely free — no sign-up, no cost, no catch.</p>
          <div className="about-cta-actions">
            <Link to="/understand" className="btn btn-primary btn-lg">Try Understand</Link>
            <Link to="/prepare" className="btn btn-secondary btn-lg">Build a prep kit</Link>
            <Link to="/connect" className="btn btn-secondary btn-lg">Find care near me</Link>
          </div>
        </section>

      </div>
    </main>
  );
}
