/* ============================================================
   CLEARCARE — MAIN JS v2
   Scroll reveal · Nav scroll · Stats counter · Demo card · Lang modal
   ============================================================ */

const nav = document.getElementById('mainNav');
window.addEventListener('scroll', () => {
  if (!nav) return;
  nav.classList.toggle('scrolled', window.scrollY > 12);
}, { passive: true });

function toggleMobileNav() {
  document.getElementById('mobileNav')?.classList.toggle('open');
}

function openLangModal() {
  document.getElementById('langModal')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLangModal() {
  document.getElementById('langModal')?.classList.remove('open');
  document.body.style.overflow = '';
}
function setLang(code, el) {
  document.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
  el?.classList.add('active');
  document.querySelectorAll('.lang-btn').forEach(b => {
    const globe = b.querySelector('svg');
    b.textContent = code;
    if (globe) b.prepend(globe);
  });
  localStorage.setItem('cc_lang', code);
}
const savedLang = localStorage.getItem('cc_lang');
if (savedLang) {
  document.querySelectorAll('.lang-btn').forEach(b => {
    const globe = b.querySelector('svg');
    b.textContent = savedLang;
    if (globe) b.prepend(globe);
  });
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLangModal();
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const siblings = [...entry.target.parentElement.querySelectorAll('.reveal')];
      const idx = siblings.indexOf(entry.target);
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, idx * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

function animateCount(el, target, prefix = '') {
  const duration = 1800;
  const start = performance.now();
  if (target === 0) { el.textContent = prefix + '0'; return; }
  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = prefix + current.toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.stat-num[data-target]').forEach(el => {
        animateCount(el, parseInt(el.dataset.target), el.dataset.prefix || '');
      });
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

const statsSection = document.querySelector('.stats');
if (statsSection) statsObserver.observe(statsSection);

document.addEventListener('DOMContentLoaded', () => {
  const status = document.getElementById('demoStatus');
  const result = document.getElementById('demoResult');
  const lines  = document.getElementById('demoLines');
  if (!status || !result) return;

  const lineEls = lines?.querySelectorAll('.demo-line');
  let lineIdx = 0;
  const scanInterval = setInterval(() => {
    if (!lineEls || lineIdx >= lineEls.length) { clearInterval(scanInterval); return; }
    lineEls[lineIdx].style.background = 'rgba(27,87,176,0.30)';
    lineEls[lineIdx].style.transition = 'background 0.3s';
    lineIdx++;
  }, 300);

  setTimeout(() => {
    if (status) {
      status.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Done';
      status.style.background = 'rgba(11,168,144,0.15)';
      status.style.borderColor = 'rgba(11,168,144,0.30)';
      status.style.color = '#5EEAD4';
    }
  }, 2000);

  setTimeout(() => {
    result?.classList.add('show');
  }, 2400);

  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    if (path.includes(link.getAttribute('href'))) link.classList.add('active');
  });
});
