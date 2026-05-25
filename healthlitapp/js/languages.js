(function attachClearCareLanguages(root) {
  const STORAGE_KEY = 'clearcare_language';
  const LEGACY_STORAGE_KEY = 'cc_lang';

  const languages = Object.freeze([
    { code: 'en', label: 'English', nativeLabel: 'English', instructionName: 'English', dir: 'ltr' },
    { code: 'es', label: 'Spanish', nativeLabel: 'Español', instructionName: 'Spanish', dir: 'ltr' },
    { code: 'ne', label: 'Nepali', nativeLabel: 'नेपाली', instructionName: 'Nepali', dir: 'ltr' },
    { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', instructionName: 'Hindi', dir: 'ltr' },
    { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', instructionName: 'Arabic', dir: 'rtl' },
    { code: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt', instructionName: 'Vietnamese', dir: 'ltr' },
    { code: 'zh', label: 'Chinese Simplified', nativeLabel: '简体中文', instructionName: 'Simplified Chinese', dir: 'ltr' },
    { code: 'fr', label: 'French', nativeLabel: 'Français', instructionName: 'French', dir: 'ltr' },
    { code: 'ur', label: 'Urdu', nativeLabel: 'اردو', instructionName: 'Urdu', dir: 'rtl' },
    { code: 'ko', label: 'Korean', nativeLabel: '한국어', instructionName: 'Korean', dir: 'ltr' }
  ]);

  const languageMap = new Map(languages.map(language => [language.code, language]));
  const defaultLanguage = languages[0];

  function normalizeLanguageCode(value) {
    return String(value || '').trim().toLowerCase();
  }

  function getLanguage(value) {
    const code = normalizeLanguageCode(value);
    return languageMap.get(code) || defaultLanguage;
  }

  function getStoredLanguage(storage) {
    if (!storage) return defaultLanguage;
    const storedCode = storage.getItem(STORAGE_KEY);
    if (storedCode) return getLanguage(storedCode);

    const legacyCode = storage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyCode) return defaultLanguage;

    const migratedLanguage = getLanguage(legacyCode);
    storage.setItem(STORAGE_KEY, migratedLanguage.code);
    storage.removeItem(LEGACY_STORAGE_KEY);
    return migratedLanguage;
  }

  function hasStoredLanguage(storage) {
    if (!storage) return false;
    return Boolean(storage.getItem(STORAGE_KEY) || storage.getItem(LEGACY_STORAGE_KEY));
  }

  function setStoredLanguage(storage, code) {
    const language = getLanguage(code);
    if (storage) {
      storage.setItem(STORAGE_KEY, language.code);
      storage.removeItem(LEGACY_STORAGE_KEY);
    }

    return language;
  }

  root.ClearCareLanguages = {
    STORAGE_KEY,
    LEGACY_STORAGE_KEY,
    languages,
    defaultLanguage,
    hasStoredLanguage,
    getLanguage,
    getStoredLanguage,
    setStoredLanguage
  };
})(globalThis);
