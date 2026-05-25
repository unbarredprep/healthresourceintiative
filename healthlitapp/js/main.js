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
  document.getElementById('langModal')?.removeAttribute('data-first-run');
  document.body.style.overflow = '';
}

function getLanguageTools() {
  return window.ClearCareLanguages || {
    STORAGE_KEY: 'clearcare_language',
    languages: [{ code: 'en', label: 'English', instructionName: 'English' }],
    defaultLanguage: { code: 'en', label: 'English', instructionName: 'English' },
    getLanguage: () => ({ code: 'en', label: 'English', instructionName: 'English' }),
    getStoredLanguage: () => ({ code: 'en', label: 'English', instructionName: 'English' })
  };
}

function getSelectedLanguage() {
  return getLanguageTools().getStoredLanguage(localStorage);
}

function renderLanguageOptions() {
  const languageTools = getLanguageTools();
  document.querySelectorAll('.lang-grid').forEach(grid => {
    grid.innerHTML = languageTools.languages.map(language => `
      <button class="lang-option" type="button" data-language-code="${language.code}" data-no-translate>
        <span class="lang-option-native">${language.nativeLabel || language.label}</span>
        <span class="lang-option-english">${language.label}</span>
      </button>
    `).join('');
  });
}

function ensureLanguageModalCopy() {
  document.querySelectorAll('#langModal .modal').forEach(modal => {
    const title = modal.querySelector('.modal-title');
    if (title && !modal.querySelector('.modal-subtitle')) {
      title.insertAdjacentHTML('afterend', '<p class="modal-subtitle">Choose the language you want to use. ClearCare will remember it on this device.</p>');
    }

    const closeButton = modal.querySelector('.modal-close');
    if (closeButton && !closeButton.textContent.trim()) {
      closeButton.textContent = 'Done';
    }
  });
}

function updateLanguageUI(language = getSelectedLanguage()) {
  document.documentElement.lang = language.code;
  document.documentElement.dir = language.dir || 'ltr';
  document.querySelectorAll('.lang-option').forEach(option => {
    option.classList.toggle('active', option.dataset.languageCode === language.code);
  });

  document.querySelectorAll('.lang-btn').forEach(b => {
    const globe = b.querySelector('svg');
    b.textContent = language.code.toUpperCase();
    if (globe) b.prepend(globe);
  });
}

function setLang(code) {
  const languageTools = getLanguageTools();
  const language = languageTools.setStoredLanguage
    ? languageTools.setStoredLanguage(localStorage, code)
    : languageTools.getLanguage(code);
  updateLanguageUI(language);
  window.ClearCareI18n?.translatePage(language);
  window.dispatchEvent(new CustomEvent('clearcare:languagechange', { detail: { language } }));
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
  const languageTools = getLanguageTools();
  const hadStoredLanguage = languageTools.hasStoredLanguage
    ? languageTools.hasStoredLanguage(localStorage)
    : Boolean(localStorage.getItem(languageTools.STORAGE_KEY));

  ensureLanguageModalCopy();
  renderLanguageOptions();
  const selectedLanguage = getSelectedLanguage();
  updateLanguageUI(selectedLanguage);
  window.ClearCareI18n?.translatePage(selectedLanguage);

  document.querySelectorAll('.lang-grid').forEach(grid => {
    grid.addEventListener('click', event => {
      const option = event.target.closest('[data-language-code]');
      if (!option) return;
      setLang(option.dataset.languageCode);
    });
  });

  if (!hadStoredLanguage && !window.location.pathname.endsWith('/onboarding.html')) {
    const modal = document.getElementById('langModal');
    if (modal) {
      modal.setAttribute('data-first-run', 'true');
      window.setTimeout(openLangModal, 250);
    }
  }

  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .nav-links a').forEach(link => {
    const href = link.getAttribute('href') || '';
    const hrefPage = href.split('/').pop();
    if (hrefPage === path) link.classList.add('active');
  });

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
});
