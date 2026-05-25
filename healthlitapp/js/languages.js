(function attachClearCareLanguages(root) {
  const STORAGE_KEY = 'clearcare_language';
  const LEGACY_STORAGE_KEY = 'cc_lang';

  const languages = Object.freeze([
    { code: 'en', label: 'English', instructionName: 'English' },
    { code: 'es', label: 'Spanish', instructionName: 'Spanish' },
    { code: 'ne', label: 'Nepali', instructionName: 'Nepali' },
    { code: 'hi', label: 'Hindi', instructionName: 'Hindi' },
    { code: 'ar', label: 'Arabic', instructionName: 'Arabic' },
    { code: 'vi', label: 'Vietnamese', instructionName: 'Vietnamese' },
    { code: 'zh', label: 'Chinese Simplified', instructionName: 'Simplified Chinese' },
    { code: 'fr', label: 'French', instructionName: 'French' },
    { code: 'ur', label: 'Urdu', instructionName: 'Urdu' },
    { code: 'ko', label: 'Korean', instructionName: 'Korean' }
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

  root.ClearCareLanguages = {
    STORAGE_KEY,
    LEGACY_STORAGE_KEY,
    languages,
    defaultLanguage,
    getLanguage,
    getStoredLanguage
  };
})(globalThis);
