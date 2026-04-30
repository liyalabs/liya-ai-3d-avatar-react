/**
 * ==================================================
 * ██╗     ██╗██╗   ██╗ █████╗
 * ██║     ██║╚██╗ ██╔╝██╔══██╗
 * ██║     ██║ ╚████╔╝ ███████║
 * ██║     ██║  ╚██╔╝  ██╔══██║
 * ███████╗██║   ██║   ██║  ██║
 * ╚══════╝╚═╝   ╚═╝   ╚═╝  ╚═╝
 *        AI Assistant
 * ==================================================
 * Author / Creator : Mahmut Denizli (With help of LiyaAi)
 * License          : MIT
 * Connect          : liyalabs.com, info@liyalabs.com
 * ==================================================
 */
import { useState, useCallback, useMemo } from "react";
import {
  translations,
  detectBrowserLocale,
  isSupportedLocale,
  type SupportedLocale,
  type Translations,
} from "../i18n/translations";

// Global state for locale to keep it synced across components
let globalLocale: SupportedLocale = "tr";
const listeners = new Set<(locale: SupportedLocale) => void>();

export function useI18n() {
  const [locale, setLocaleState] = useState<SupportedLocale>(globalLocale);

  const setLocale = useCallback((newLocale: string): void => {
    const nextLocale: SupportedLocale = isSupportedLocale(newLocale)
      ? (newLocale as SupportedLocale)
      : "tr";
    globalLocale = nextLocale;
    setLocaleState(nextLocale);
    listeners.forEach((listener) => listener(nextLocale));
  }, []);

  const initLocale = useCallback((configLocale?: string): void => {
    let nextLocale: SupportedLocale;
    if (configLocale && isSupportedLocale(configLocale)) {
      nextLocale = configLocale as SupportedLocale;
    } else if (configLocale) {
      nextLocale = "tr";
    } else {
      nextLocale = detectBrowserLocale();
    }

    globalLocale = nextLocale;
    setLocaleState(nextLocale);
    listeners.forEach((listener) => listener(nextLocale));
  }, []);

  const t = useMemo<Translations>(() => translations[locale], [locale]);

  /**
   * Resolves a dot-notated translation path (e.g., 'settings.presetNames.classicBlue')
   */
  const translate = useCallback(
    (path: string): string => {
      try {
        const keys = path.split(".");
        let current: any = translations[locale];
        for (const key of keys) {
          if (current[key] === undefined) return path;
          current = current[key];
        }
        return typeof current === "string" ? current : path;
      } catch {
        return path;
      }
    },
    [locale],
  );

  return {
    locale,
    t,
    translate,
    setLocale,
    initLocale,
    isSupportedLocale,
  };
}
