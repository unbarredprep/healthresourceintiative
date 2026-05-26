import { createContext, useContext, useState, useEffect } from 'react';

export const LANGUAGES = [
  { code: 'en', label: 'English',            nativeLabel: 'English',    instructionName: 'English',            dir: 'ltr' },
  { code: 'es', label: 'Spanish',            nativeLabel: 'Español',    instructionName: 'Spanish',            dir: 'ltr' },
  { code: 'ne', label: 'Nepali',             nativeLabel: 'नेपाली',      instructionName: 'Nepali',             dir: 'ltr' },
  { code: 'hi', label: 'Hindi',              nativeLabel: 'हिन्दी',      instructionName: 'Hindi',              dir: 'ltr' },
  { code: 'ar', label: 'Arabic',             nativeLabel: 'العربية',    instructionName: 'Arabic',             dir: 'rtl' },
  { code: 'vi', label: 'Vietnamese',         nativeLabel: 'Tiếng Việt', instructionName: 'Vietnamese',         dir: 'ltr' },
  { code: 'zh', label: 'Chinese Simplified', nativeLabel: '简体中文',     instructionName: 'Simplified Chinese', dir: 'ltr' },
  { code: 'fr', label: 'French',             nativeLabel: 'Français',   instructionName: 'French',             dir: 'ltr' },
  { code: 'ur', label: 'Urdu',               nativeLabel: 'اردو',       instructionName: 'Urdu',               dir: 'rtl' },
  { code: 'ko', label: 'Korean',             nativeLabel: '한국어',       instructionName: 'Korean',             dir: 'ltr' }
];

const STORAGE_KEY = 'clearcare_language';
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLang] = useState(() => {
    const code = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
  });

  useEffect(() => {
    document.documentElement.lang = language.code;
    document.documentElement.dir  = language.dir;
  }, [language]);

  function setLanguage(code) {
    const lang = LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
    localStorage.setItem(STORAGE_KEY, lang.code);
    setLang(lang);
  }

  return (
    <LanguageContext.Provider value={{ language, languages: LANGUAGES, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
