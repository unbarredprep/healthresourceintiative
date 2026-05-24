/* ============================================================
   CLEARCARE — MAIN JS
   Global interactions: nav, language modal, doc card animation
   ============================================================ */

// ---- MOBILE NAV ----
function toggleMobileNav() {
  document.getElementById('mobileNav').classList.toggle('open');
}

// ---- LANGUAGE MODAL ----
function openLangModal() {
  document.getElementById('langModal').classList.add('open');
}
function closeLangModal() {
  document.getElementById('langModal').classList.remove('open');
}
function setLang(code) {
  document.querySelectorAll('.lang-option').forEach(el => el.classList.remove('active'));
  event.currentTarget.classList.add('active');
  document.querySelector('.lang-btn').textContent = code + ' ▾';
  localStorage.setItem('cc_lang', code);
}

// ---- DOC CARD ANIMATION (hero) ----
// Simulates the "processing" → "result" reveal on the landing page
document.addEventListener('DOMContentLoaded', () => {
  const badge = document.querySelector('.doc-badge');
  const result = document.querySelector('.doc-result');
  if (!badge || !result) return;

  result.style.opacity = '0';
  result.style.transform = 'translateY(10px)';
  result.style.transition = 'all 0.5s ease';

  setTimeout(() => {
    badge.textContent = 'Done ✓';
    badge.style.background = '#E0F5F2';
    badge.style.color = '#065F46';
    badge.style.animation = 'none';
  }, 2000);

  setTimeout(() => {
    result.style.opacity = '1';
    result.style.transform = 'translateY(0)';
  }, 2400);
});

// ---- NAV SCROLL SHADOW ----
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  nav.style.boxShadow = window.scrollY > 10
    ? '0 2px 16px rgba(10,22,40,0.10)'
    : 'none';
});

// ---- RESTORE LANGUAGE PREF ----
const savedLang = localStorage.getItem('cc_lang');
if (savedLang) {
  const btn = document.querySelector('.lang-btn');
  if (btn) btn.textContent = savedLang + ' ▾';
}
