(function attachClearCareI18n(root) {
  const CACHE_VERSION   = 'v1';
  const MAX_BATCH_SIZE  = 10;
  const MAX_STRING_LENGTH = 500;
  const TEXT_NODE_FILTER  = root.NodeFilter?.SHOW_TEXT || 4;

  const textOriginals      = new WeakMap();
  const attributeOriginals = new WeakMap();
  let   originalTitle      = '';
  let   activeRequestId    = 0;

  const attributeNames = ['placeholder', 'aria-label', 'title', 'alt'];
  const skippedTags    = new Set(['SCRIPT','STYLE','NOSCRIPT','SVG','PATH','META','LINK']);

  /* ── Core translations for UI chrome (no API needed) ── */
  const coreTranslations = {
    es: {
      'Choose your language': 'Elige tu idioma',
      'Choose the language you want to use. ClearCare will remember it on this device.': 'Elige el idioma que quieres usar. ClearCare lo recordará en este dispositivo.',
      'Done': 'Listo',
      'Translating page...': 'Traduciendo la página...',
      'Could not translate the page right now. Please try again.': 'No pudimos traducir la página ahora. Inténtalo de nuevo.'
    },
    ne: {
      'Choose your language': 'आफ्नो भाषा छान्नुहोस्',
      'Done': 'सकियो',
      'Translating page...': 'पृष्ठ अनुवाद हुँदैछ...'
    },
    hi: {
      'Choose your language': 'अपनी भाषा चुनें',
      'Done': 'हो गया',
      'Translating page...': 'पेज का अनुवाद हो रहा है...'
    },
    ar: {
      'Choose your language': 'اختر لغتك',
      'Done': 'تم',
      'Translating page...': 'جارٍ ترجمة الصفحة...'
    },
    vi: {
      'Choose your language': 'Chọn ngôn ngữ của bạn',
      'Done': 'Xong',
      'Translating page...': 'Đang dịch trang...'
    },
    zh: {
      'Choose your language': '选择你的语言',
      'Done': '完成',
      'Translating page...': '正在翻译页面...'
    },
    fr: {
      'Choose your language': 'Choisissez votre langue',
      'Done': 'Terminé',
      'Translating page...': 'Traduction de la page...'
    },
    ur: {
      'Choose your language': 'اپنی زبان منتخب کریں',
      'Done': 'مکمل',
      'Translating page...': 'صفحہ ترجمہ ہو رہا ہے...'
    },
    ko: {
      'Choose your language': '언어를 선택하세요',
      'Done': '완료',
      'Translating page...': '페이지를 번역하는 중...'
    }
  };

  /* ── MyMemory free API — no key needed ── */
  async function fetchTranslationFromAPI(text, targetCode) {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetCode}`;
      const res  = await fetch(url);
      const data = await res.json();
      const translated = data?.responseData?.translatedText;
      // MyMemory returns the original text when it fails — detect and discard
      if (!translated || translated.toLowerCase() === text.toLowerCase()) return null;
      return translated;
    } catch {
      return null;
    }
  }

  async function requestTranslations(language, strings) {
    const results = {};
    // Translate in small batches with a short delay to respect rate limits
    for (const text of strings) {
      const translated = await fetchTranslationFromAPI(text, language.code);
      if (translated) results[text] = translated;
      await new Promise(r => setTimeout(r, 120)); // 120ms between requests
    }
    return results;
  }

  /* ── DOM helpers (unchanged from original) ── */
  function getLanguageTools() {
    return root.ClearCareLanguages || {
      defaultLanguage: { code: 'en', label: 'English', nativeLabel: 'English', instructionName: 'English', dir: 'ltr' },
      getStoredLanguage: () => ({ code: 'en', label: 'English', nativeLabel: 'English', instructionName: 'English', dir: 'ltr' })
    };
  }

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function shouldSkipElement(element) {
    return !element
      || skippedTags.has(element.tagName)
      || element.closest('[data-no-translate], [data-i18n-skip], .nav-logo, .logo-text');
  }

  function shouldTranslateString(value) {
    const text = normalizeText(value);
    return text.length > 1
      && text.length <= MAX_STRING_LENGTH
      && /[A-Za-z]/.test(text); // only translate strings with Latin characters (English)
  }

  function getTextNodes(container) {
    const nodes  = [];
    const walker = document.createTreeWalker(container, TEXT_NODE_FILTER, {
      acceptNode(node) {
        if (shouldSkipElement(node.parentElement)) return NodeFilter.FILTER_REJECT;
        if (!shouldTranslateString(node.nodeValue))  return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  function rememberTextNode(node, refresh) {
    if (refresh || !textOriginals.has(node)) textOriginals.set(node, node.nodeValue);
  }

  function rememberAttributes(element, refresh) {
    let originals = attributeOriginals.get(element);
    if (!originals || refresh) { originals = {}; attributeOriginals.set(element, originals); }
    for (const attr of attributeNames) {
      if (element.hasAttribute(attr) && (refresh || originals[attr] === undefined)) {
        originals[attr] = element.getAttribute(attr);
      }
    }
  }

  function collectOriginalStrings(container, options = {}) {
    const strings = new Set();
    getTextNodes(container).forEach(node => {
      rememberTextNode(node, options.refreshOriginals);
      const original = normalizeText(textOriginals.get(node));
      if (shouldTranslateString(original)) strings.add(original);
    });
    container.querySelectorAll(attributeNames.map(n => `[${n}]`).join(',')).forEach(el => {
      if (shouldSkipElement(el)) return;
      rememberAttributes(el, options.refreshOriginals);
      const originals = attributeOriginals.get(el) || {};
      for (const value of Object.values(originals)) {
        if (shouldTranslateString(value)) strings.add(normalizeText(value));
      }
    });
    if (!originalTitle) originalTitle = document.title;
    if (shouldTranslateString(originalTitle)) strings.add(normalizeText(originalTitle));
    return [...strings];
  }

  function translatedValue(languageCode, text, cache) {
    if (languageCode === 'en') return text;
    return coreTranslations[languageCode]?.[text] || cache[text] || text;
  }

  function replaceTextPreservingSpace(original, translated) {
    const leading  = original.match(/^\s*/)?.[0]  || '';
    const trailing = original.match(/\s*$/)?.[0]  || '';
    return `${leading}${translated}${trailing}`;
  }

  function applyTranslations(container, languageCode, cache, options = {}) {
    getTextNodes(container).forEach(node => {
      rememberTextNode(node, options.refreshOriginals);
      const original   = textOriginals.get(node);
      const normalized = normalizeText(original);
      const translated = translatedValue(languageCode, normalized, cache);
      node.nodeValue   = replaceTextPreservingSpace(original, translated);
    });

    container.querySelectorAll(attributeNames.map(n => `[${n}]`).join(',')).forEach(el => {
      if (shouldSkipElement(el)) return;
      rememberAttributes(el, options.refreshOriginals);
      const originals = attributeOriginals.get(el) || {};
      for (const [attr, original] of Object.entries(originals)) {
        el.setAttribute(attr, translatedValue(languageCode, normalizeText(original), cache));
      }
    });

    if (!originalTitle) originalTitle = document.title;
    document.title = translatedValue(languageCode, normalizeText(originalTitle), cache);
  }

  /* ── Cache helpers ── */
  function getCacheKey(code) { return `clearcare_ui_translations_${CACHE_VERSION}_${code}`; }

  function loadCache(code) {
    try { return JSON.parse(localStorage.getItem(getCacheKey(code)) || '{}') || {}; }
    catch { return {}; }
  }

  function saveCache(code, cache) {
    try { localStorage.setItem(getCacheKey(code), JSON.stringify(cache)); } catch { /* ok */ }
  }

  /* ── Main translate function ── */
  async function translateElement(container = document.body, options = {}) {
    const language     = options.language || getLanguageTools().getStoredLanguage(localStorage);
    const languageCode = language.code;
    const requestId    = ++activeRequestId;

    if (!container) return;

    document.documentElement.lang = languageCode;
    document.documentElement.dir  = language.dir || 'ltr';

    const strings = collectOriginalStrings(container, options);
    const cache   = loadCache(languageCode);

    // Apply what we already have (core + cached) immediately
    applyTranslations(container, languageCode, cache, options);

    if (languageCode === 'en') return;

    // Find strings not yet in cache or core translations
    const core    = coreTranslations[languageCode] || {};
    const missing = strings.filter(text => !cache[text] && !core[text]);
    if (!missing.length) return;

    try {
      // Translate in batches via MyMemory
      for (let i = 0; i < missing.length; i += MAX_BATCH_SIZE) {
        if (requestId !== activeRequestId) return; // user switched language, abort
        const batch        = missing.slice(i, i + MAX_BATCH_SIZE);
        const translations = await requestTranslations(language, batch);
        Object.entries(translations).forEach(([source, translated]) => {
          const key = normalizeText(source);
          const val = normalizeText(translated);
          if (key && val) cache[key] = val;
        });
        saveCache(languageCode, cache);
        applyTranslations(container, languageCode, cache, options);
      }
    } catch (error) {
      console.warn('ClearCare translation error:', error.message);
    }
  }

  function translatePage(language) {
    return translateElement(document.body, { language });
  }

  root.ClearCareI18n = { translatePage, translateElement, collectOriginalStrings };

})(window);
