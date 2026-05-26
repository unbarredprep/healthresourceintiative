(function attachClearCareI18n(root) {
  const CACHE_VERSION     = 'v2';
  const TEXT_NODE_FILTER  = root.NodeFilter?.SHOW_TEXT || 4;
  const textOriginals     = new WeakMap();
  const attributeOriginals = new WeakMap();
  let   originalTitle     = '';
  let   activeRequestId   = 0;
  let   isTranslating     = false;

  const attributeNames = ['placeholder', 'aria-label', 'title', 'alt'];
  const skippedTags    = new Set(['SCRIPT','STYLE','NOSCRIPT','SVG','PATH','META','LINK']);

  /* ── Hardcoded UI chrome translations (instant, no API) ── */
  const coreTranslations = {
    es: { 'Choose your language': 'Elige tu idioma', 'Done': 'Listo' },
    hi: { 'Choose your language': 'अपनी भाषा चुनें', 'Done': 'हो गया' },
    ne: { 'Choose your language': 'आफ्नो भाषा छान्नुहोस्', 'Done': 'सकियो' },
    ar: { 'Choose your language': 'اختر لغتك', 'Done': 'تم' },
    vi: { 'Choose your language': 'Chọn ngôn ngữ của bạn', 'Done': 'Xong' },
    zh: { 'Choose your language': '选择你的语言', 'Done': '完成' },
    fr: { 'Choose your language': 'Choisissez votre langue', 'Done': 'Terminé' },
    ur: { 'Choose your language': 'اپنی زبان منتخب کریں', 'Done': 'مکمل' },
    ko: { 'Choose your language': '언어를 선택하세요', 'Done': '완료' }
  };

  /* ── Helpers ── */
  function getLanguageTools() {
    return root.ClearCareLanguages || {
      defaultLanguage: { code: 'en', label: 'English', instructionName: 'English', dir: 'ltr' },
      getStoredLanguage: () => ({ code: 'en', label: 'English', instructionName: 'English', dir: 'ltr' })
    };
  }

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function shouldSkipElement(el) {
    return !el
      || skippedTags.has(el.tagName)
      || el.closest('[data-no-translate],[data-i18n-skip],.nav-logo,.logo-text,.logo-mark');
  }

  function shouldTranslate(text) {
    const t = normalizeText(text);
    return t.length > 1 && t.length < 1000 && /[A-Za-z]/.test(t);
  }

  function getTextNodes(container) {
    const nodes  = [];
    const walker = document.createTreeWalker(container, TEXT_NODE_FILTER, {
      acceptNode(node) {
        if (shouldSkipElement(node.parentElement)) return NodeFilter.FILTER_REJECT;
        if (!shouldTranslate(node.nodeValue))       return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  /* ── Collect all English strings from the page ── */
  function collectStrings(container) {
    const strings = new Set();

    getTextNodes(container).forEach(node => {
      if (!textOriginals.has(node)) textOriginals.set(node, node.nodeValue);
      const original = normalizeText(textOriginals.get(node));
      if (shouldTranslate(original)) strings.add(original);
    });

    container.querySelectorAll(attributeNames.map(n => `[${n}]`).join(',')).forEach(el => {
      if (shouldSkipElement(el)) return;
      if (!attributeOriginals.has(el)) {
        const originals = {};
        for (const attr of attributeNames) {
          if (el.hasAttribute(attr)) originals[attr] = el.getAttribute(attr);
        }
        attributeOriginals.set(el, originals);
      }
      const originals = attributeOriginals.get(el) || {};
      for (const value of Object.values(originals)) {
        if (shouldTranslate(value)) strings.add(normalizeText(value));
      }
    });

    if (!originalTitle) originalTitle = document.title;
    if (shouldTranslate(originalTitle)) strings.add(normalizeText(originalTitle));

    return [...strings];
  }

  /* ── Apply a translation map to the DOM ── */
  function applyTranslations(container, langCode, cache) {
    const core = coreTranslations[langCode] || {};

    function translated(original) {
      if (langCode === 'en') return original;
      return core[original] || cache[original] || original;
    }

    getTextNodes(container).forEach(node => {
      const original   = textOriginals.get(node) || node.nodeValue;
      const normalized = normalizeText(original);
      const result     = translated(normalized);
      const leading    = original.match(/^\s*/)?.[0]  || '';
      const trailing   = original.match(/\s*$/)?.[0]  || '';
      node.nodeValue   = `${leading}${result}${trailing}`;
    });

    container.querySelectorAll(attributeNames.map(n => `[${n}]`).join(',')).forEach(el => {
      if (shouldSkipElement(el)) return;
      const originals = attributeOriginals.get(el) || {};
      for (const [attr, original] of Object.entries(originals)) {
        el.setAttribute(attr, translated(normalizeText(original)));
      }
    });

    if (originalTitle) {
      document.title = translated(normalizeText(originalTitle));
    }
  }

  /* ── Cache helpers ── */
  function cacheKey(code) { return `cc_trans_${CACHE_VERSION}_${code}`; }
  function loadCache(code) {
    try { return JSON.parse(localStorage.getItem(cacheKey(code)) || '{}'); } catch { return {}; }
  }
  function saveCache(code, cache) {
    try { localStorage.setItem(cacheKey(code), JSON.stringify(cache)); } catch {}
  }

  /* ── Worker translation — routed through /api/ui-translate ── */
  async function translateViaWorker(strings, language) {
    const res = await fetch('/api/ui-translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: language.code, strings })
    });

    if (!res.ok) return {};

    const data = await res.json();
    return data.translations || {};
  }

  /* ── Main entry point ── */
  async function translateElement(container = document.body, options = {}) {
    const language  = options.language || getLanguageTools().getStoredLanguage(localStorage);
    const langCode  = language.code;
    const requestId = ++activeRequestId;

    if (!container) return;

    document.documentElement.lang = langCode;
    document.documentElement.dir  = language.dir || 'ltr';

    // English — restore originals and stop
    if (langCode === 'en') {
      applyTranslations(container, 'en', {});
      return;
    }

    // Load cache and apply instantly what we already have
    const cache = loadCache(langCode);
    applyTranslations(container, langCode, cache);

    // Find strings not yet translated
    const strings = collectStrings(container);
    const core    = coreTranslations[langCode] || {};
    const missing = strings.filter(s => !cache[s] && !core[s]);

    if (!missing.length) return; // everything already cached

    if (isTranslating) return; // don't stack calls
    isTranslating = true;

    try {
      // Split into chunks of 60 strings to stay within token limits
      const chunkSize = 60;
      for (let i = 0; i < missing.length; i += chunkSize) {
        if (requestId !== activeRequestId) break; // user switched language
        const batch        = missing.slice(i, i + chunkSize);
        const translations = await translateViaWorker(batch, language);

        Object.entries(translations).forEach(([source, translated]) => {
          const k = normalizeText(source);
          const v = normalizeText(translated);
          if (k && v && k !== v) cache[k] = v;
        });

        saveCache(langCode, cache);
        if (requestId === activeRequestId) {
          applyTranslations(container, langCode, cache);
        }
      }
    } catch (err) {
      console.warn('ClearCare translation error:', err.message);
    } finally {
      isTranslating = false;
    }
  }

  function translatePage(language) {
    return translateElement(document.body, { language });
  }

  root.ClearCareI18n = { translatePage, translateElement, collectStrings };

})(window);
