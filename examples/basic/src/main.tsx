/**
 * Liya 3D Avatar Demo — React Mode Demo
 *
 * Vanilla JS örneğindeki mode selection UI'ını React'e uyarlar.
 * Kullanıcı standard / modal_kiosk / kiosk modları arasında geçiş yapabilir.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import type {} from "react";
import ReactDOM from "react-dom/client";
import { LiyaAvatarWidget } from "@liyalabs/liya-3d-avatar-widget-react";

// ── Types ─────────────────────────────────────────────────────────────────
type WidgetMode = "standard" | "modal_kiosk" | "kiosk";

interface ModeCard {
  mode: WidgetMode;
  icon: string;
  title: string;
  desc: string;
  badge: string;
}

const MODE_CARDS: ModeCard[] = [
  {
    mode: "standard",
    icon: "📐",
    title: "Standard",
    desc: "Sağ alt köşede toggle ile açılır/kapanır",
    badge: "Floating",
  },
  {
    mode: "modal_kiosk",
    icon: "🖼️",
    title: "Modal Kiosk",
    desc: "Merkezde modal olarak açılır, arka plan kararır",
    badge: "Modal",
  },
  {
    mode: "kiosk",
    icon: "🖥️",
    title: "Tam Ekran Kiosk",
    desc: "Widget tam ekranı kaplar — kiosk deneyimi",
    badge: "Fullscreen",
  },
];

const MODE_LABELS: Record<WidgetMode, string> = {
  standard: "Standard",
  modal_kiosk: "Modal Kiosk",
  kiosk: "Tam Ekran Kiosk",
};

// ── Helpers ───────────────────────────────────────────────────────────────
function maskValue(val: string | undefined): string {
  if (!val || val.length < 8) return "••••••••";
  return val.slice(0, 4) + "••••" + val.slice(-4);
}

function isKioskMode(mode: WidgetMode): boolean {
  return mode === "kiosk" || mode === "modal_kiosk";
}

// ── Config type ───────────────────────────────────────────────────────────
interface ConfigData {
  apiKey: string;
  baseUrl: string;
  assistantId: string;
}

// ── Demo App Component ────────────────────────────────────────────────────
function DemoApp() {
  // State
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<WidgetMode | null>(null);
  const [widgetKey, setWidgetKey] = useState(0); // force remount
  const [widgetVisible, setWidgetVisible] = useState(false);

  // DOM helpers — HTML'deki placeholder card'ları ID ile bul
  const $ = <T extends HTMLElement>(id: string): T | null =>
    document.getElementById(id) as T | null;

  // Refs (sadece React tarafından yönetilenler)
  const modeGridRef = useRef<HTMLDivElement>(null);

  // ── Status helpers ──────────────────────────────────────────────────────
  const setStatus = useCallback(
    (type: "loading" | "error" | "success", msg: string) => {
      const el = $<HTMLDivElement>("statusBar");
      if (el) {
        el.className = "status--" + type;
        el.textContent = msg;
      }
    },
    [],
  );

  const setActiveCard = useCallback((mode: WidgetMode | null) => {
    if (!modeGridRef.current) return;
    const cards = modeGridRef.current.querySelectorAll(".mode-card");
    cards.forEach((card) => {
      card.classList.toggle("active", card.getAttribute("data-mode") === mode);
    });
  }, []);

  const showKioskBar = useCallback((mode: WidgetMode) => {
    const nameEl = $<HTMLSpanElement>("kioskModeName");
    if (nameEl) nameEl.textContent = MODE_LABELS[mode] || mode;
    const bar = $<HTMLDivElement>("kioskExitBar");
    if (bar) bar.classList.add("visible");
    const info = $<HTMLDivElement>("activeInfo");
    if (info) info.style.display = "none";
  }, []);

  const hideKioskBar = useCallback(() => {
    const bar = $<HTMLDivElement>("kioskExitBar");
    if (bar) bar.classList.remove("visible");
  }, []);

  const showActiveInfo = useCallback((mode: WidgetMode) => {
    const info = $<HTMLDivElement>("activeInfo");
    if (info) info.style.display = "";
    const nameEl = $<HTMLSpanElement>("activeModeName");
    if (nameEl) nameEl.textContent = MODE_LABELS[mode] || mode;
  }, []);

  const hideActiveInfo = useCallback(() => {
    const info = $<HTMLDivElement>("activeInfo");
    if (info) info.style.display = "none";
  }, []);

  // ── Widget lifecycle ────────────────────────────────────────────────────
  const destroyWidget = useCallback(() => {
    setCurrentMode(null);
    setWidgetVisible(false);
    setActiveCard(null);
    hideKioskBar();
    hideActiveInfo();
    setStatus("success", "✅ Widget kaldırıldı. Yeni mod seçebilirsiniz.");
  }, [setActiveCard, hideKioskBar, hideActiveInfo, setStatus]);

  const launchWidget = useCallback(
    (mode: WidgetMode) => {
      if (!config) {
        setStatus("error", "❌ Config henüz yüklenmedi, bekleyin…");
        return;
      }

      // Önce mevcut widget'ı temizle
      destroyWidget();

      // Kısa gecikme — state reset için
      setTimeout(() => {
        setCurrentMode(mode);
        setWidgetKey((prev) => prev + 1);
        setWidgetVisible(true);
        setActiveCard(mode);

        setStatus(
          "success",
          `✅ Widget [${MODE_LABELS[mode]}] modunda başlatıldı.`,
        );

        if (isKioskMode(mode)) {
          showKioskBar(mode);
        } else {
          showActiveInfo(mode);
        }
      }, 100);
    },
    [
      config,
      destroyWidget,
      setActiveCard,
      setStatus,
      showKioskBar,
      showActiveInfo,
    ],
  );

  // ── Switch / toggle ─────────────────────────────────────────────────────
  const switchTo = useCallback(
    (mode: WidgetMode) => {
      if (!config) {
        setStatus("error", "❌ Config yüklenmedi.");
        return;
      }
      if (mode === currentMode) {
        if (isKioskMode(mode)) return; // kiosk'ta toggle anlamsız
        // Toggle: show/hide
        setWidgetVisible((prev) => !prev);
        return;
      }
      launchWidget(mode);
    },
    [config, currentMode, launchWidget, setStatus],
  );

  // ── Expose API to window (for kiosk exit bar buttons) ───────────────────
  useEffect(() => {
    (window as any).__demoApi = {
      switchTo,
      destroy: destroyWidget,
    };
    return () => {
      delete (window as any).__demoApi;
    };
  }, [switchTo, destroyWidget]);

  // ── Build mode cards ────────────────────────────────────────────────────
  useEffect(() => {
    if (!modeGridRef.current) return;
    const grid = modeGridRef.current;
    grid.innerHTML = "";

    MODE_CARDS.forEach((card) => {
      const el = document.createElement("div");
      el.className = "mode-card";
      el.setAttribute("data-mode", card.mode);
      el.innerHTML = `
        <div class="card-icon">${card.icon}</div>
        <div class="card-title">${card.title}</div>
        <div class="card-desc">${card.desc}</div>
        <span class="card-badge">${card.badge}</span>
      `;
      el.addEventListener("click", () => switchTo(card.mode));
      grid.appendChild(el);
    });
  }, [switchTo]);

  // ── Fetch config ────────────────────────────────────────────────────────
  useEffect(() => {
    setStatus("loading", "⏳ Config yükleniyor…");

    // Önce .env'deki değerleri dene
    const envApiKey = import.meta.env.VITE_LIYA_API_KEY as string;
    const envBaseUrl = import.meta.env.VITE_LIYA_BASE_URL as string;
    const envAssistantId = import.meta.env.VITE_ASSISTANT_ID as string;

    if (envApiKey && envBaseUrl && envAssistantId) {
      const data: ConfigData = {
        apiKey: envApiKey,
        baseUrl: envBaseUrl,
        assistantId: envAssistantId,
      };
      setConfig(data);

      const apiKeyEl = $<HTMLSpanElement>("cfgApiKey");
      if (apiKeyEl) {
        apiKeyEl.textContent = maskValue(data.apiKey);
        apiKeyEl.className = "info-value";
      }
      const baseUrlEl = $<HTMLSpanElement>("cfgBaseUrl");
      if (baseUrlEl) baseUrlEl.textContent = data.baseUrl;
      const asstIdEl = $<HTMLSpanElement>("cfgAssistantId");
      if (asstIdEl) asstIdEl.textContent = data.assistantId;
      const statusEl = $<HTMLSpanElement>("cfgStatus");
      if (statusEl)
        statusEl.innerHTML =
          '<span style="color:#86efac">✓ Config OK (.env)</span>';

      setStatus("success", "✅ Config yüklendi — bir mod seçerek başlatın.");
      return;
    }

    // .env yoksa config.php'den fetch et
    fetch("/config.php")
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((data: ConfigData & { error?: boolean; message?: string }) => {
        if ((data as any).error) {
          setStatus("error", "❌ " + (data as any).message);
          const stEl = $<HTMLSpanElement>("cfgStatus");
          if (stEl) stEl.textContent = "Hata";
          setConfigError((data as any).message);
          return;
        }

        setConfig(data as ConfigData);

        const apiKeyEl = $<HTMLSpanElement>("cfgApiKey");
        if (apiKeyEl) {
          apiKeyEl.textContent = maskValue((data as ConfigData).apiKey);
          apiKeyEl.className = "info-value";
        }
        const baseUrlEl = $<HTMLSpanElement>("cfgBaseUrl");
        if (baseUrlEl) baseUrlEl.textContent = (data as ConfigData).baseUrl;
        const asstIdEl = $<HTMLSpanElement>("cfgAssistantId");
        if (asstIdEl) asstIdEl.textContent = (data as ConfigData).assistantId;
        const stEl = $<HTMLSpanElement>("cfgStatus");
        if (stEl)
          stEl.innerHTML = '<span style="color:#86efac">✓ Config OK</span>';

        setStatus("success", "✅ Config yüklendi — bir mod seçerek başlatın.");
      })
      .catch((err) => {
        setStatus("error", "❌ Config yüklenemedi: " + err.message);
        const stEl = $<HTMLSpanElement>("cfgStatus");
        if (stEl) stEl.textContent = "Bağlantı Hatası";
        setConfigError(err.message);
      });
  }, [setStatus]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Mode cards container — DOM'a elle basılıyor */}
      <div ref={modeGridRef} id="modeGrid" className="mode-grid" />

      {/* Widget — key ile force remount */}
      {widgetVisible && currentMode && config && (
        <LiyaAvatarWidget
          key={widgetKey}
          apiKey={config.apiKey}
          baseUrl={config.baseUrl}
          assistantId={config.assistantId}
          liyaWidgetMode={currentMode}
          welcomeSuggestions={[
            "Nasıl başlarım?",
            "Fiyatlar nedir?",
            "Demo göster",
          ]}
          showBranding
          showAvatarButton
          autoSpeak
          theme={{ primaryColor: "#6366f1" }}
          onMessageSent={(msg: string) => console.log("sent:", msg)}
          onMessageReceived={(msg: string) => console.log("received:", msg)}
        />
      )}
    </>
  );
}

// ── Mount ─────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DemoApp />
  </React.StrictMode>,
);
