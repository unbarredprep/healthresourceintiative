import { useState, useEffect } from 'react';
import { useLanguage } from './useLanguage';
import { translateStrings } from '../api';

const cacheKey = code => `cc_trans_v3_${code}`;
const loadCache = code => { try { return JSON.parse(localStorage.getItem(cacheKey(code)) || '{}'); } catch { return {}; } };
const saveCache = (code, data) => { try { localStorage.setItem(cacheKey(code), JSON.stringify(data)); } catch {} };

export function useTranslate(strings = []) {
  const { language } = useLanguage();
  const [map, setMap] = useState(() => loadCache(language.code));

  useEffect(() => {
    if (language.code === 'en' || !strings.length) {
      setMap({});
      return;
    }

    const cache   = loadCache(language.code);
    const missing = strings.filter(s => !cache[s]);

    setMap(cache);

    if (!missing.length) return;

    translateStrings(language.code, missing)
      .then(fresh => {
        const updated = { ...cache, ...fresh };
        saveCache(language.code, updated);
        setMap(updated);
      })
      .catch(() => {});
  }, [language.code, strings.join('|')]);

  return (str) => (language.code === 'en' ? str : (map[str] || str));
}
