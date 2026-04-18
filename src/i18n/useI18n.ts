import { useState, useCallback } from 'react';
import translations, { SupportedLocale } from './translations';

function detectLocale(): SupportedLocale {
  const lang = navigator.language?.toLowerCase() ?? '';
  return lang.startsWith('tr') ? 'tr' : 'en';
}

export function useI18n(initial?: SupportedLocale) {
  const [locale, setLocale] = useState<SupportedLocale>(initial ?? detectLocale());
  const t = useCallback((key: string): string => translations[locale][key] ?? key, [locale]);
  return { t, locale, setLocale };
}
