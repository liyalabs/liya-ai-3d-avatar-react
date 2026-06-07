/**
 * Liya AI Logger
 * Sadece development ortamında log basar.
 * - Vite/browser: import.meta.env.DEV === true → log açık
 * - Node/SSR:    process.env.NODE_ENV === 'development' → log açık
 */

function detectDev(): boolean {
  // 1) Vite / modern bundler — browser side
  try {
    // @ts-ignore — import.meta tüm ortamlarda olmayabilir
    if (typeof import.meta !== "undefined" && (import.meta as any).env) {
      // @ts-ignore
      return Boolean((import.meta as any).env.DEV);
    }
  } catch {
    // ignore
  }

  // 2) Node.js / SSR fallback
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV === "development"
  ) {
    return true;
  }

  return false;
}

const isDev = detectDev();

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  error: (...args: unknown[]) => {
    if (isDev) console.error(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  },
};
