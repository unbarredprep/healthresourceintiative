(function attachClearCareI18n(root) {
  const UI_TRANSLATE_ENDPOINT = '/api/ui-translate';
  const CACHE_VERSION = 'v1';
  const MAX_BATCH_SIZE = 80;
  const MAX_STRING_LENGTH = 500;
  const TEXT_NODE_FILTER = root.NodeFilter?.SHOW_TEXT || 4;
  const textOriginals = new WeakMap();
  const attributeOriginals = new WeakMap();
  let originalTitle = '';
  let activeRequestId = 0;

  const attributeNames = ['placeholder', 'aria-label', 'title', 'alt'];
  const skippedTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'META', 'LINK']);

  const coreTranslations = {
    es: {
      'Choose your language': 'Elige tu idioma',
      'Choose the language you want to use. ClearCare will remember it on this device.': 'Elige el idioma que quieres usar. ClearCare lo recordará en este dispositivo.',
      Done: 'Listo',
      'Translating page...': 'Traduciendo la página...',
      'Translation is not configured yet. The app will stay in English until setup is finished.': 'La traducción aún no está configurada. La aplicación permanecerá en inglés hasta terminar la configuración.',
      'Could not translate the page right now. Please try again.': 'No pudimos traducir la página ahora. Inténtalo de nuevo.'
    },
    ne: {
      'Choose your language': 'आफ्नो भाषा छान्नुहोस्',
      'Choose the language you want to use. ClearCare will remember it on this device.': 'तपाईंले प्रयोग गर्न चाहेको भाषा छान्नुहोस्। ClearCare ले यो उपकरणमा सम्झनेछ।',
      Done: 'सकियो',
      'Translating page...': 'पृष्ठ अनुवाद हुँदैछ...',
      'Translation is not configured yet. The app will stay in English until setup is finished.': 'अनुवाद अझै कन्फिगर गरिएको छैन। सेटअप पूरा नभएसम्म एप अंग्रेजीमै रहनेछ।',
      'Could not translate the page right now. Please try again.': 'अहिले पृष्ठ अनुवाद गर्न सकिएन। कृपया फेरि प्रयास गर्नुहोस्।'
    },
    hi: {
      'Choose your language': 'अपनी भाषा चुनें',
      'Choose the language you want to use. ClearCare will remember it on this device.': 'जिस भाषा का उपयोग करना चाहते हैं उसे चुनें। ClearCare इसे इस डिवाइस पर याद रखेगा।',
      Done: 'हो गया',
      'Translating page...': 'पेज का अनुवाद हो रहा है...',
      'Translation is not configured yet. The app will stay in English until setup is finished.': 'अनुवाद अभी सेट नहीं है। सेटअप पूरा होने तक ऐप अंग्रेज़ी में रहेगा।',
      'Could not translate the page right now. Please try again.': 'अभी पेज का अनुवाद नहीं हो सका। कृपया फिर कोशिश करें।'
    },
    ar: {
      'Choose your language': 'اختر لغتك',
      'Choose the language you want to use. ClearCare will remember it on this device.': 'اختر اللغة التي تريد استخدامها. سيتذكر ClearCare ذلك على هذا الجهاز.',
      Done: 'تم',
      'Translating page...': 'جارٍ ترجمة الصفحة...',
      'Translation is not configured yet. The app will stay in English until setup is finished.': 'لم يتم إعداد الترجمة بعد. سيبقى التطبيق باللغة الإنجليزية حتى يكتمل الإعداد.',
      'Could not translate the page right now. Please try again.': 'تعذر ترجمة الصفحة الآن. يرجى المحاولة مرة أخرى.'
    },
    vi: {
      'Choose your language': 'Chọn ngôn ngữ của bạn',
      'Choose the language you want to use. ClearCare will remember it on this device.': 'Chọn ngôn ngữ bạn muốn dùng. ClearCare sẽ ghi nhớ trên thiết bị này.',
      Done: 'Xong',
      'Translating page...': 'Đang dịch trang...',
      'Translation is not configured yet. The app will stay in English until setup is finished.': 'Tính năng dịch chưa được thiết lập. Ứng dụng sẽ giữ tiếng Anh cho đến khi hoàn tất.',
      'Could not translate the page right now. Please try again.': 'Hiện không thể dịch trang. Vui lòng thử lại.'
    },
    zh: {
      'Choose your language': '选择你的语言',
      'Choose the language you want to use. ClearCare will remember it on this device.': '选择你想使用的语言。ClearCare 会在此设备上记住它。',
      Done: '完成',
      'Translating page...': '正在翻译页面...',
      'Translation is not configured yet. The app will stay in English until setup is finished.': '翻译尚未配置完成。设置完成前，应用将保持英文。',
      'Could not translate the page right now. Please try again.': '现在无法翻译页面。请重试。'
    },
    fr: {
      'Choose your language': 'Choisissez votre langue',
      'Choose the language you want to use. ClearCare will remember it on this device.': 'Choisissez la langue que vous voulez utiliser. ClearCare la gardera en mémoire sur cet appareil.',
      Done: 'Terminé',
      'Translating page...': 'Traduction de la page...',
      'Translation is not configured yet. The app will stay in English until setup is finished.': "La traduction n'est pas encore configurée. L'application restera en anglais jusqu'à la fin de la configuration.",
      'Could not translate the page right now. Please try again.': 'Impossible de traduire la page pour le moment. Veuillez réessayer.'
    },
    ur: {
      'Choose your language': 'اپنی زبان منتخب کریں',
      'Choose the language you want to use. ClearCare will remember it on this device.': 'وہ زبان منتخب کریں جو آپ استعمال کرنا چاہتے ہیں۔ ClearCare اسے اس ڈیوائس پر یاد رکھے گا۔',
      Done: 'مکمل',
      'Translating page...': 'صفحہ ترجمہ ہو رہا ہے...',
      'Translation is not configured yet. The app will stay in English until setup is finished.': 'ترجمہ ابھی ترتیب نہیں دیا گیا۔ سیٹ اپ مکمل ہونے تک ایپ انگریزی میں رہے گی۔',
      'Could not translate the page right now. Please try again.': 'اس وقت صفحہ ترجمہ نہیں ہو سکا۔ براہ کرم دوبارہ کوشش کریں۔'
    },
    ko: {
      'Choose your language': '언어를 선택하세요',
      'Choose the language you want to use. ClearCare will remember it on this device.': '사용할 언어를 선택하세요. ClearCare가 이 기기에 기억합니다.',
      Done: '완료',
      'Translating page...': '페이지를 번역하는 중...',
      'Translation is not configured yet. The app will stay in English until setup is finished.': '번역이 아직 설정되지 않았습니다. 설정이 끝날 때까지 앱은 영어로 표시됩니다.',
      'Could not translate the page right now. Please try again.': '지금 페이지를 번역할 수 없습니다. 다시 시도해 주세요.'
    }
  };

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
      && /[A-Za-z0-9]/.test(text);
  }

  function getTextNodes(container) {
    const nodes = [];
    const walker = document.createTreeWalker(container, TEXT_NODE_FILTER, {
      acceptNode(node) {
        if (shouldSkipElement(node.parentElement)) return NodeFilter.FILTER_REJECT;
        if (!shouldTranslateString(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  function rememberTextNode(node, refreshOriginals) {
    if (refreshOriginals || !textOriginals.has(node)) {
      textOriginals.set(node, node.nodeValue);
    }
  }

  function rememberAttributes(element, refreshOriginals) {
    let originals = attributeOriginals.get(element);
    if (!originals || refreshOriginals) {
      originals = {};
      attributeOriginals.set(element, originals);
    }

    for (const attributeName of attributeNames) {
      if (element.hasAttribute(attributeName) && (refreshOriginals || originals[attributeName] === undefined)) {
        originals[attributeName] = element.getAttribute(attributeName);
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

    container.querySelectorAll(attributeNames.map(name => `[${name}]`).join(',')).forEach(element => {
      if (shouldSkipElement(element)) return;
      rememberAttributes(element, options.refreshOriginals);
      const originals = attributeOriginals.get(element) || {};
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

  function replaceTextPreservingSpace(originalText, translatedText) {
    const leading = originalText.match(/^\s*/)?.[0] || '';
    const trailing = originalText.match(/\s*$/)?.[0] || '';
    return `${leading}${translatedText}${trailing}`;
  }

  function applyTranslations(container, languageCode, cache, options = {}) {
    getTextNodes(container).forEach(node => {
      rememberTextNode(node, options.refreshOriginals);
      const original = textOriginals.get(node);
      const normalizedOriginal = normalizeText(original);
      const translated = translatedValue(languageCode, normalizedOriginal, cache);
      node.nodeValue = replaceTextPreservingSpace(original, translated);
    });

    container.querySelectorAll(attributeNames.map(name => `[${name}]`).join(',')).forEach(element => {
      if (shouldSkipElement(element)) return;
      rememberAttributes(element, options.refreshOriginals);
      const originals = attributeOriginals.get(element) || {};
      for (const [attributeName, original] of Object.entries(originals)) {
        const translated = translatedValue(languageCode, normalizeText(original), cache);
        element.setAttribute(attributeName, translated);
      }
    });

    if (!originalTitle) originalTitle = document.title;
    document.title = translatedValue(languageCode, normalizeText(originalTitle), cache);
  }

  function getCacheKey(languageCode) {
    return `clearcare_ui_translations_${CACHE_VERSION}_${languageCode}`;
  }

  function loadCache(languageCode) {
    try {
      return JSON.parse(localStorage.getItem(getCacheKey(languageCode)) || '{}') || {};
    } catch (error) {
      return {};
    }
  }

  function saveCache(languageCode, cache) {
    try {
      localStorage.setItem(getCacheKey(languageCode), JSON.stringify(cache));
    } catch (error) {
      // Translation cache is helpful, not required.
    }
  }

  function chunk(items, size) {
    const chunks = [];
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }
    return chunks;
  }

  async function requestTranslations(language, strings) {
    const response = await fetch(UI_TRANSLATE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: language.code,
        strings
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || 'Translation failed');
      error.code = data.error || 'UI_TRANSLATION_FAILED';
      throw error;
    }

    return data.translations || {};
  }

  async function translateElement(container = document.body, options = {}) {
    const language = options.language || getLanguageTools().getStoredLanguage(localStorage);
    const languageCode = language.code;
    const requestId = ++activeRequestId;

    if (!container) return;

    document.documentElement.lang = language.code;
    document.documentElement.dir = language.dir || 'ltr';

    const strings = collectOriginalStrings(container, options);
    const cache = loadCache(languageCode);
    applyTranslations(container, languageCode, cache, options);

    if (languageCode === 'en') return;

    const core = coreTranslations[languageCode] || {};
    const missing = strings.filter(text => !cache[text] && !core[text]);
    if (!missing.length) return;

    try {
      for (const batch of chunk(missing, MAX_BATCH_SIZE)) {
        const translations = await requestTranslations(language, batch);
        if (requestId !== activeRequestId) return;
        Object.entries(translations).forEach(([source, translated]) => {
          const key = normalizeText(source);
          const value = normalizeText(translated);
          if (key && value) cache[key] = value;
        });
        saveCache(languageCode, cache);
        applyTranslations(container, languageCode, cache, options);
      }
    } catch (error) {
      console.warn('ClearCare UI translation failed:', error.message);
    }
  }

  function translatePage(language) {
    return translateElement(document.body, { language });
  }

  root.ClearCareI18n = {
    translatePage,
    translateElement,
    collectOriginalStrings
  };
})(window);
