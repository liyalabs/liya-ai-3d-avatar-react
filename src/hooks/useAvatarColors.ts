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
// Liya AI Chat - useAvatarColors Hook (React Version)
import { useState, useCallback, useEffect } from "react";
import { logger } from "../utils/logger";

export interface AvatarColorPreset {
  id: string;
  name: string;
  top: string;
  bottom: string;
  footwear: string;
}

export interface AvatarColors {
  top: string;
  bottom: string;
  footwear: string;
}

const STORAGE_KEY = "liya-avatar-colors-react";

const DEFAULT_COLORS: AvatarColors = {
  top: "#F8FAFC",
  bottom: "#E2E8F0",
  footwear: "#CBD5E1",
};

const COLOR_PRESETS: AvatarColorPreset[] = [
  {
    id: "classic-blue",
    name: "settings.presetNames.classicBlue",
    top: "#3B82F6",
    bottom: "#1E293B",
    footwear: "#374151",
  },
  {
    id: "red-energy",
    name: "settings.presetNames.redEnergy",
    top: "#EF4444",
    bottom: "#1E293B",
    footwear: "#374151",
  },
  {
    id: "green-nature",
    name: "settings.presetNames.greenNature",
    top: "#10B981",
    bottom: "#1E293B",
    footwear: "#374151",
  },
  {
    id: "purple-royal",
    name: "settings.presetNames.purpleRoyal",
    top: "#8B5CF6",
    bottom: "#1E293B",
    footwear: "#374151",
  },
  {
    id: "orange-warm",
    name: "settings.presetNames.orangeWarm",
    top: "#F97316",
    bottom: "#1E293B",
    footwear: "#374151",
  },
  {
    id: "pink-soft",
    name: "settings.presetNames.pinkSoft",
    top: "#EC4899",
    bottom: "#F3E8FF",
    footwear: "#9333EA",
  },
  {
    id: "dark-elegant",
    name: "settings.presetNames.darkElegant",
    top: "#1E293B",
    bottom: "#0F172A",
    footwear: "#1E293B",
  },
  {
    id: "white-clean",
    name: "settings.presetNames.whiteClean",
    top: "#F8FAFC",
    bottom: "#E2E8F0",
    footwear: "#CBD5E1",
  },
];

// Global singleton state
let globalColors = { ...DEFAULT_COLORS };
let globalPresetId: string | null = "white-clean";
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function loadFromStorage() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.colors) globalColors = { ...DEFAULT_COLORS, ...parsed.colors };
      if (parsed.presetId) globalPresetId = parsed.presetId;
    }
  } catch {}
}

function saveToStorage() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        colors: globalColors,
        presetId: globalPresetId,
      }),
    );
  } catch {}
}

// Initial load
loadFromStorage();

export function useAvatarColors() {
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    listeners.add(forceUpdate);
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        logger.log("[useAvatarColors] 🔄 Storage updated in another tab");
        loadFromStorage();
        notify();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      listeners.delete(forceUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, [forceUpdate]);

  const setPreset = useCallback((presetId: string) => {
    const preset = COLOR_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      globalColors = {
        top: preset.top,
        bottom: preset.bottom,
        footwear: preset.footwear,
      };
      globalPresetId = presetId;
      saveToStorage();
      notify();
    }
  }, []);

  const setColor = useCallback((part: keyof AvatarColors, color: string) => {
    globalColors = { ...globalColors, [part]: color };
    globalPresetId = null;
    saveToStorage();
    notify();
  }, []);

  const setColors = useCallback((newColors: Partial<AvatarColors>) => {
    globalColors = { ...globalColors, ...newColors };
    globalPresetId = null;
    saveToStorage();
    notify();
  }, []);

  const reset = useCallback(() => {
    logger.log("[useAvatarColors] 🧹 Resetting to defaults");
    globalColors = { ...DEFAULT_COLORS };
    globalPresetId = "white-clean";
    saveToStorage();
    notify();
  }, []);

  return {
    colors: globalColors,
    currentPresetId: globalPresetId,
    presets: COLOR_PRESETS,
    defaultColors: DEFAULT_COLORS,
    setPreset,
    setColor,
    setColors,
    reset,
    init: loadFromStorage,
  };
}
