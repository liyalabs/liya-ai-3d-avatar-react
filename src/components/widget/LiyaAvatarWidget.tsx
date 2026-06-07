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
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import type { ThemeConfig, LiyaWidgetMode } from "../../types";
import { useChat } from "../../hooks/useChat";
import { useVoice } from "../../hooks/useVoice";
import { useI18n } from "../../hooks/useI18n";
import { useAvatarColors } from "../../hooks/useAvatarColors";
import {
  getConfig,
  getAvatarModel,
  initializeClient,
  reinitializeClient,
  resetClient,
  isInitialized,
} from "../../api";
import { resetGlobalChat } from "../../hooks/useChat";
import { MessageList, ChatInput } from "../shared";
import { AvatarScene } from "../avatar";
import { stripForTTS } from "../../utils/tts";
import { adjustColor } from "../../utils/color";
import { logger } from "../../utils/logger";
import "./LiyaAvatarWidget.css";

export interface LiyaAvatarWidgetProps {
  apiKey?: string;
  baseUrl?: string;
  assistantId?: string;
  position?: ThemeConfig["position"];
  theme?: ThemeConfig;
  assistantName?: string;
  welcomeMessage?: string;
  welcomeSuggestions?: string[];
  placeholder?: string;
  showBranding?: boolean;
  showVoice?: boolean;
  voiceEnabled?: boolean;
  showFileUpload?: boolean;
  showAvatarButton?: boolean;
  avatarModelUrl?: string;
  offsetX?: number;
  offsetY?: number;
  liyaWidgetMode?: LiyaWidgetMode;
  locale?: string;
  autoSpeak?: boolean;
  animateButton?: boolean;
  viewOnPageStart?: boolean;
  closeButtonEnabled?: boolean;
  onOpened?: () => void;
  onClosed?: () => void;
  onMessageSent?: (message: string) => void;
  onMessageReceived?: (message: string) => void;
}

export default function LiyaAvatarWidgetWrapper(props: LiyaAvatarWidgetProps) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!props.apiKey || !props.baseUrl || !props.assistantId) {
      logger.error("[LiyaAvatarWidget] ❌ Missing required props:", {
        apiKey: !props.apiKey ? "MISSING" : "ok",
        baseUrl: !props.baseUrl ? "MISSING" : "ok",
        assistantId: !props.assistantId ? "MISSING" : "ok",
      });
      return;
    }

    // Always reset + reinit so fresh credentials are used on every mount
    resetClient();
    logger.log(
      "[LiyaAvatarWidget] 🔧 Calling initializeClient with fresh credentials...",
    );
    initializeClient({
      apiKey: props.apiKey,
      baseUrl: props.baseUrl,
      assistantId: props.assistantId,
      mode: "widget",
      assistantName: props.assistantName,
      avatarModelUrl: props.avatarModelUrl,
      theme: props.theme || {},
      locale: props.locale,
    });
    logger.log(
      "[LiyaAvatarWidget] ✅ initializeClient done, isInitialized:",
      isInitialized(),
    );
    setReady(true);

    return () => {
      // Cleanup on unmount — reset singleton so next mount gets fresh state
      resetClient();
      logger.log("[LiyaAvatarWidget] 🧹 Unmounted — client reset");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.apiKey, props.baseUrl, props.assistantId]);

  if (!ready) {
    return <div style={{ display: "none" }} data-state="initializing" />;
  }

  return <LiyaAvatarWidget {...props} />;
}

function LiyaAvatarWidget({
  apiKey,
  baseUrl,
  assistantId,
  position = "bottom-right",
  theme = {},
  assistantName = "",
  welcomeMessage = "",
  welcomeSuggestions = [],
  placeholder = "",
  showBranding = true,
  showVoice = true,
  voiceEnabled = true,
  showFileUpload = true,
  showAvatarButton = true,
  avatarModelUrl = "",
  offsetX = 20,
  offsetY = 20,
  liyaWidgetMode = "standard",
  locale: propLocale = "",
  autoSpeak = true,
  animateButton = true,
  viewOnPageStart = false,
  closeButtonEnabled = true,
  onOpened,
  onClosed,
  onMessageSent,
  onMessageReceived,
}: LiyaAvatarWidgetProps) {
  const config = getConfig();

  // Detect parent page language from html[lang] or navigator.language
  const detectParentPageLanguage = useCallback((): string | undefined => {
    const supported = ["tr", "en", "zh"];
    // Check html[lang] attribute
    const htmlLang = document.documentElement.lang;
    if (htmlLang) {
      const lang = htmlLang.split("-")[0].toLowerCase();
      if (supported.includes(lang)) return lang;
    }
    // Check navigator.language
    const navLang =
      navigator.language ||
      (navigator as { userLanguage?: string }).userLanguage;
    if (navLang) {
      const lang = navLang.split("-")[0].toLowerCase();
      if (supported.includes(lang)) return lang;
    }
    return undefined;
  }, []);

  const { t, translate, locale, initLocale, setLocale } = useI18n();
  const {
    messages,
    isLoading,
    currentSessionId,
    sendMessage,
    initFromStorage,
    loadHistory,
    addWelcomeMessage,
    updateWelcomeMessage,
  } = useChat();
  const {
    isRecording,
    isSupported: isVoiceSupported,
    transcript,
    startRecording,
    stopRecording,
    clearTranscript,
    micPermission,
    requestMicPermission,
  } = useVoice();
  const {
    colors: avatarColors,
    presets: colorPresets,
    currentPresetId,
    setPreset,
    setColor,
    reset: resetColors,
  } = useAvatarColors();

  // State
  const [isOpen, setIsOpen] = useState(
    liyaWidgetMode !== "standard" || viewOnPageStart,
  );
  const [isAvatarVisible, setIsAvatarVisible] = useState(true);
  const [backendAvatarUrl, setBackendAvatarUrl] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPreparingSpeech, setIsPreparingSpeech] = useState(false);
  const [currentVisemes, setCurrentVisemes] = useState<any[]>([]);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [lastSpokenText, setLastSpokenText] = useState("");
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [isMessageBoxVisible, setIsMessageBoxVisible] = useState(true);
  const [preparingMessageIndex, setPreparingMessageIndex] = useState(0);
  const [preparingStartTime, setPreparingStartTime] = useState(0);
  const [uiScale, setUiScale] = useState(1.0);
  const [kioskSize, setKioskSize] = useState({ width: 0, height: 0 });

  // Welcome message: resolved from prop or i18n fallback
  const welcomeMessageText = useMemo(
    () => welcomeMessage || t.chat.welcomeMessage,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [welcomeMessage, locale],
  );

  // Refs
  const hasPlayedWelcomeRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const preparingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const avatarSceneRef = useRef<any>(null);
  const kioskControlsRef = useRef<HTMLDivElement | null>(null);
  const kioskAvatarRef = useRef<HTMLDivElement | null>(null);

  // Fetch avatar model from backend
  const fetchModel = useCallback(async () => {
    logger.log("[LiyaAvatarWidget] 🔍 fetchModel called", {
      avatarModelUrl,
      configAvatarModelUrl: config.avatarModelUrl,
      configAssistantId: config.assistantId,
      configBaseUrl: config.baseUrl,
    });

    if (avatarModelUrl || config.avatarModelUrl) {
      logger.log(
        "[LiyaAvatarWidget] ⏭️ fetchModel skipped — url already set:",
        avatarModelUrl || config.avatarModelUrl,
      );
      return;
    }

    try {
      logger.log("[LiyaAvatarWidget] 📡 Calling getAvatarModel API...");
      const res = await getAvatarModel(config.assistantId);
      logger.log("[LiyaAvatarWidget] ✅ Avatar model fetched:", res);
      setBackendAvatarUrl(res.model_url);
    } catch (e: any) {
      logger.error("[LiyaAvatarWidget] ❌ fetchModel error:", {
        message: e?.message,
        code: e?.code,
        status: e?.response?.status,
        data: e?.response?.data,
      });
    }
  }, [avatarModelUrl, config.avatarModelUrl, config.assistantId]);

  // Initialize
  useEffect(() => {
    logger.log("[LiyaAvatarWidget] 🏁 Mount useEffect — starting init", {
      config: {
        baseUrl: config.baseUrl,
        assistantId: config.assistantId,
        avatarModelUrl: config.avatarModelUrl,
        locale: config.locale,
      },
      propLocale,
      currentSessionId,
    });
    initLocale(propLocale || config.locale || detectParentPageLanguage());
    initFromStorage();
    if (currentSessionId) loadHistory(currentSessionId);
    fetchModel();
  }, [
    config.baseUrl,
    config.assistantId,
    config.avatarModelUrl,
    config.locale,
    propLocale,
    currentSessionId,
    initLocale,
    initFromStorage,
    loadHistory,
    fetchModel,
  ]);

  // uiScale & kiosk avatar size — mirrors Vue's computeUiScale + computeKioskLayout
  const computeUiScale = useCallback((): number => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1920;
    if (w >= 3840) return 1.7;
    if (w >= 2560) return 1.25;
    return 1.0;
  }, []);

  const computeKioskSize = useCallback(
    (scale: number) => {
      if (typeof window === "undefined") return { width: 520, height: 620 };
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isModal = liyaWidgetMode === "modal_kiosk";
      const controlsHeight = kioskControlsRef.current
        ? kioskControlsRef.current.getBoundingClientRect().height
        : (isMessageBoxVisible ? 360 : 200) * scale;
      // Avatar genişliği: container - yatay padding (her iki taraf clamp(16px,2vw,48px))
      const hPad = Math.min(48, Math.max(16, vw * 0.02));
      const containerW = isModal
        ? Math.min(vw * 0.5, 860) - hPad * 2
        : Math.min(960, vw) - hPad * 2;
      const avatarH = Math.min(
        Math.max(200, vh - controlsHeight - 60),
        1100 * scale,
      );
      return { width: Math.round(containerW), height: Math.round(avatarH) };
    },
    [liyaWidgetMode, isMessageBoxVisible],
  );

  useEffect(() => {
    const handleResize = () => {
      const s = computeUiScale();
      setUiScale(s);
      setKioskSize(computeKioskSize(s));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [computeUiScale, computeKioskSize]);

  // Recompute kiosk size when message box visibility changes
  useEffect(() => {
    setKioskSize(computeKioskSize(uiScale));
  }, [isMessageBoxVisible, uiScale, computeKioskSize]);

  const resolvedAvatarUrl =
    avatarModelUrl || config.avatarModelUrl || backendAvatarUrl;

  // Debug: log whenever resolvedAvatarUrl changes
  useEffect(() => {
    logger.log("[LiyaAvatarWidget] 🖼️ resolvedAvatarUrl:", {
      resolvedAvatarUrl,
      avatarModelUrl,
      configAvatarModelUrl: config.avatarModelUrl,
      backendAvatarUrl,
      isEmpty: !resolvedAvatarUrl,
    });
  }, [resolvedAvatarUrl]);

  // Audio context
  const ensureAudioContext =
    useCallback(async (): Promise<AudioContext | null> => {
      if (!audioContextRef.current) {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }
      if (audioContextRef.current?.state === "suspended")
        await audioContextRef.current.resume();
      return audioContextRef.current;
    }, []);

  // Play audio
  const playAudio = useCallback(
    async (base64: string) => {
      try {
        const binary = atob(base64);
        const len = binary.length;
        const buffer = new ArrayBuffer(len);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < len; i++) view[i] = binary.charCodeAt(i);
        const ctx = await ensureAudioContext();
        if (!ctx) return;
        const audioBuffer = await new Promise<AudioBuffer>((res, rej) =>
          ctx.decodeAudioData(buffer, res, rej),
        );
        if (audioSourceRef.current) {
          audioSourceRef.current.stop();
          audioSourceRef.current.disconnect();
        }
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        audioSourceRef.current = source;
        setIsSpeaking(true);
        startTimeRef.current = ctx.currentTime;
        const update = () => {
          if (ctx) {
            setAudioCurrentTime(ctx.currentTime - startTimeRef.current);
            animFrameRef.current = requestAnimationFrame(update);
          }
        };
        update();
        source.onended = () => {
          setIsSpeaking(false);
          setAudioCurrentTime(0);
          setCurrentVisemes([]);
        };
        source.start();
      } catch (e) {
        setIsSpeaking(false);
      }
    },
    [ensureAudioContext],
  );

  // Speak
  const speak = useCallback(
    async (text: string) => {
      try {
        setIsPreparingSpeech(true);
        const res = await fetch(
          `${config.baseUrl}/api/v1/external/avatar/speech/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": config.apiKey,
            },
            body: JSON.stringify({
              text,
              voice: "nova",
              speed: 1.0,
              include_audio: true,
            }),
          },
        );
        const data = await res.json();
        setIsPreparingSpeech(false);
        if (data.status === "success" && data.data) {
          setCurrentVisemes(data.data.visemes || []);
          setLastSpokenText(text);
          if (data.data.audio_base64) await playAudio(data.data.audio_base64);
        }
      } catch (e) {
        setIsPreparingSpeech(false);
      }
    },
    [config.baseUrl, config.apiKey, playAudio],
  );

  // Handle send
  const handleSend = useCallback(
    async (msg: string) => {
      if (!msg.trim()) return;
      try {
        logger.log("[LiyaAvatarWidget] 📤 handleSend:", msg);
        onMessageSent?.(msg);
        const res = await sendMessage(msg, undefined, locale);
        if (res?.assistant_message?.content || res?.response) {
          const text = res.assistant_message?.content || res.response || "";
          onMessageReceived?.(text);
          if (isAvatarVisible && autoSpeak) await speak(stripForTTS(text));
        }
      } catch (e) {
        logger.error("[LiyaAvatarWidget] ❌ handleSend error:", e);
      }
    },
    [
      onMessageSent,
      sendMessage,
      onMessageReceived,
      isAvatarVisible,
      autoSpeak,
      speak,
      locale,
    ],
  );

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSend(suggestion);
    },
    [handleSend],
  );

  // Handle voice transcript
  useEffect(() => {
    if (transcript && !isRecording) {
      handleSend(transcript);
    }
  }, [transcript, isRecording, handleSend]);

  // Handle preparing messages rotation — rotate every 4s (no initial 8s delay)
  useEffect(() => {
    if (isLoading || isPreparingSpeech) {
      setPreparingMessageIndex(0);
      setPreparingStartTime(Date.now());
      preparingTimerRef.current = setInterval(() => {
        setPreparingMessageIndex(
          (prev) => (prev + 1) % t.preparingMessages.length,
        );
      }, 4000);
    } else {
      if (preparingTimerRef.current) {
        clearInterval(preparingTimerRef.current);
        preparingTimerRef.current = null;
      }
      setPreparingMessageIndex(0);
    }
  }, [isLoading, isPreparingSpeech, t.preparingMessages.length]);

  // Apply avatar colors
  const applyCurrentColors = useCallback(() => {
    if (avatarSceneRef.current?.applyOutfitColors) {
      avatarSceneRef.current.applyOutfitColors({
        top: avatarColors.top,
        bottom: avatarColors.bottom,
        footwear: avatarColors.footwear,
      });
    }
  }, [avatarColors]);

  useEffect(() => {
    applyCurrentColors();
  }, [applyCurrentColors]);

  // CSS variables
  const cssVars = useMemo(() => {
    const primary = theme.primaryColor || "#6366f1";
    return {
      "--liya-primary-color": primary,
      "--liya-primary-hover": adjustColor(primary, -10),
      "--liya-bg-color": theme.backgroundColor || "#ffffff",
      "--liya-text-color": theme.textColor || "#374151",
      "--liya-border-radius": theme.borderRadius || "16px",
      "--liya-z-index": theme.zIndex || 9999,
      "--liya-offset-x": `${offsetX}px`,
      "--liya-offset-y": `${offsetY}px`,
      "--liya-ui-scale": String(uiScale),
    } as React.CSSProperties;
  }, [theme, offsetX, offsetY, uiScale]);

  const isFirstRender = useRef(true);

  // Toggle widget
  const toggle = useCallback(() => {
    const next = !isOpen;
    logger.log(`[LiyaAvatarWidget] 🔘 toggle: ${isOpen} → ${next}`);
    setIsOpen(next);
    if (next) {
      setIsAvatarVisible(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (isOpen) {
        onOpened?.();
        // Play welcome on initial open (kiosk / viewOnPageStart)
        if (
          !hasPlayedWelcomeRef.current &&
          messages.length === 0 &&
          welcomeMessageText
        ) {
          hasPlayedWelcomeRef.current = true;
          addWelcomeMessage(welcomeMessageText);
          if (autoSpeak) {
            setTimeout(() => speak(stripForTTS(welcomeMessageText)), 500);
          }
        }
      }
      return;
    }

    if (isOpen) {
      onOpened?.();
      // Play welcome on first open (standard mode toggle)
      if (
        !hasPlayedWelcomeRef.current &&
        messages.length === 0 &&
        welcomeMessageText
      ) {
        hasPlayedWelcomeRef.current = true;
        addWelcomeMessage(welcomeMessageText);
        if (autoSpeak) {
          setTimeout(() => speak(stripForTTS(welcomeMessageText)), 500);
        }
      }
    } else {
      onClosed?.();
    }
  }, [
    isOpen,
    onOpened,
    onClosed,
    welcomeMessageText,
    addWelcomeMessage,
    autoSpeak,
    speak,
    messages.length,
  ]);

  // Toggle locale: tr → en → zh → tr
  const toggleLocale = () => {
    if (locale === "tr") setLocale("en");
    else if (locale === "en") setLocale("zh");
    else setLocale("tr");
  };

  // When locale changes: update welcome message text + re-speak if already welcomed
  const prevLocaleRef = useRef(locale);
  useEffect(() => {
    if (prevLocaleRef.current === locale) return;
    prevLocaleRef.current = locale;
    // Update the welcome bubble in message list
    updateWelcomeMessage(welcomeMessageText);
    // Re-speak welcome in the new language
    if (hasPlayedWelcomeRef.current && autoSpeak && isOpen) {
      // Stop any current audio
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.stop();
        } catch (_) {
          /* ignore */
        }
      }
      setIsSpeaking(false);
      setCurrentVisemes([]);
      setTimeout(() => speak(stripForTTS(welcomeMessageText)), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  // Handle replay or stop
  const handleReplayOrStop = () => {
    if (isSpeaking && audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        /* ignore */
      }
      setIsSpeaking(false);
      setAudioCurrentTime(0);
      setCurrentVisemes([]);
    } else if (lastSpokenText) {
      speak(lastSpokenText);
    }
  };

  // Kiosk mode
  const isKiosk =
    liyaWidgetMode === "kiosk" || liyaWidgetMode === "modal_kiosk";
  const kioskStatus = isSpeaking
    ? "speaking"
    : isPreparingSpeech || isLoading
      ? "preparing"
      : isRecording
        ? "listening"
        : "idle";

  const kioskStatusText =
    kioskStatus === "listening"
      ? t.kiosk.listening
      : kioskStatus === "preparing"
        ? t.preparingMessages[preparingMessageIndex]
        : kioskStatus === "speaking"
          ? t.kiosk.speaking
          : t.kiosk.ready;

  // Kiosk messages
  const kioskMessages = useMemo(() => {
    const lastThree = messages.slice(-3);
    return lastThree.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }, [messages]);

  // Kiosk cancel/refresh
  const handleKioskCancel = () => {
    if (isRecording) stopRecording();
    if (isSpeaking && audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        /* ignore */
      }
      setIsSpeaking(false);
      setAudioCurrentTime(0);
      setCurrentVisemes([]);
    }
    setIsPreparingSpeech(false);
  };

  const handleKioskRefresh = () => {
    const lastAssistantMsg = messages
      .filter((m) => m.role === "assistant")
      .pop();
    if (lastAssistantMsg) {
      speak(stripForTTS(lastAssistantMsg.content));
    }
  };

  // Kiosk mic disabled: loading / speaking / preparing sırasında (Vue parity)
  const kioskMicDisabled = isLoading || isSpeaking || isPreparingSpeech;

  // Kiosk mic toggle — Vue'daki toggleKioskListening ile birebir aynı logic
  const toggleKioskListening = useCallback(() => {
    if (!isVoiceSupported) return;
    if (kioskMicDisabled) return;
    if (isRecording) {
      stopRecording();
    } else {
      // Önceki transcript'i temizle, yeni kayda başla
      clearTranscript();
      startRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isVoiceSupported,
    kioskMicDisabled,
    isRecording,
    stopRecording,
    startRecording,
    clearTranscript,
  ]);

  // Kiosk layout
  if (isKiosk) {
    // Kapat butonu çalışsın: isOpen false olunca kiosk de unmount edilmeli
    if (!isOpen) return null;

    const avatarW =
      kioskAvatarRef.current?.clientWidth || kioskSize.width || 920;
    const avatarH =
      kioskAvatarRef.current?.clientHeight ||
      kioskSize.height ||
      (typeof window !== "undefined" ? window.innerHeight * 0.65 : 620);

    return (
      <div
        className={`liya-ai-3d-avatar-react-kiosk${liyaWidgetMode === "modal_kiosk" ? " liya-ai-3d-avatar-react-kiosk--modal" : ""}`}
        style={cssVars}
      >
        <div className="liya-ai-3d-avatar-react-kiosk__content">
          {/* Arka plan overlay katmanı */}
          <div className="liya-ai-3d-avatar-react-kiosk__overlay" />

          <div className="liya-ai-3d-avatar-react-kiosk__container">
            {/* Kapat butonu — sağ üst köşe */}
            {closeButtonEnabled && (
              <button
                className="liya-ai-3d-avatar-react-kiosk__close"
                onClick={() => setIsOpen(false)}
                aria-label={t.kiosk?.close || "Close"}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="20"
                  height="20"
                >
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            )}

            {/* Mic Permission Banner — kiosk modunda, izin yokken */}
            {(micPermission === "denied" || micPermission === "prompt") && (
              <div className="liya-ai-3d-avatar-react-kiosk__mic-permission">
                <div className="liya-ai-3d-avatar-react-kiosk__mic-permission-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="22"
                    height="22"
                  >
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                </div>
                <div className="liya-ai-3d-avatar-react-kiosk__mic-permission-text">
                  <span className="liya-ai-3d-avatar-react-kiosk__mic-permission-title">
                    {micPermission === "denied"
                      ? t.kiosk?.micDenied || "Microphone access denied"
                      : t.kiosk?.micPermissionNeeded ||
                        "Microphone permission needed"}
                  </span>
                  {micPermission === "denied" && (
                    <span className="liya-ai-3d-avatar-react-kiosk__mic-permission-desc">
                      Please allow in browser settings.
                    </span>
                  )}
                </div>
                {micPermission === "prompt" && (
                  <button
                    className="liya-ai-3d-avatar-react-kiosk__mic-permission-btn"
                    onClick={requestMicPermission}
                  >
                    {t.kiosk?.allowMic || "Allow Microphone"}
                  </button>
                )}
              </div>
            )}

            {/* Avatar scene */}
            <div
              ref={kioskAvatarRef}
              className="liya-ai-3d-avatar-react-kiosk__avatar"
            >
              {/* Floating status badge — avatar üzerinde */}
              <div
                className={`liya-ai-3d-avatar-react-kiosk__status liya-ai-3d-avatar-react-kiosk__status--${kioskStatus}`}
              >
                <span className="liya-ai-3d-avatar-react-kiosk__status-dot" />
                <span className="liya-ai-3d-avatar-react-kiosk__status-text">
                  {kioskStatusText}
                </span>
                {kioskStatus !== "idle" && (
                  <button
                    className="liya-ai-3d-avatar-react-kiosk__status-btn"
                    onClick={handleKioskCancel}
                    title={t.kiosk.cancel}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      width="14"
                      height="14"
                    >
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </button>
                )}
                {kioskStatus === "idle" && (
                  <button
                    className="liya-ai-3d-avatar-react-kiosk__status-btn"
                    onClick={handleKioskRefresh}
                    title={t.kiosk.refresh}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      width="14"
                      height="14"
                    >
                      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                    </svg>
                  </button>
                )}
                <button
                  className="liya-ai-3d-avatar-react-kiosk__status-btn liya-ai-3d-avatar-react-kiosk__lang-btn"
                  onClick={toggleLocale}
                  title={
                    locale === "tr"
                      ? "Switch to English"
                      : locale === "en"
                        ? "切换到中文"
                        : "Türkçe'ye geç"
                  }
                >
                  <span className="liya-ai-3d-avatar-react-kiosk__lang-text">
                    {locale === "tr" ? "EN" : locale === "en" ? "ZH" : "TR"}
                  </span>
                </button>
              </div>

              <AvatarScene
                ref={avatarSceneRef}
                modelUrl={resolvedAvatarUrl}
                width={avatarW}
                height={avatarH}
                isSpeaking={isSpeaking}
                visemes={currentVisemes}
                currentTime={audioCurrentTime}
                backgroundColor="transparent"
                onLoaded={applyCurrentColors}
              />
            </div>

            {/* Controls — bottom */}
            <div
              ref={kioskControlsRef}
              className="liya-ai-3d-avatar-react-kiosk__controls"
            >
              {/* Message box */}
              {isMessageBoxVisible && (
                <div className="liya-ai-3d-avatar-react-kiosk__messages">
                  {kioskMessages.map((m, i) => (
                    <div
                      key={i}
                      className={`liya-ai-3d-avatar-react-kiosk__message liya-ai-3d-avatar-react-kiosk__message--${
                        m.role === "user" ? "user" : "assistant"
                      }`}
                    >
                      <p className="liya-ai-3d-avatar-react-kiosk__message-text">
                        {m.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Toggle message box */}

              <button
                className="liya-ai-3d-avatar-react-kiosk__toggle-msg-btn"
                onClick={() => setIsMessageBoxVisible(!isMessageBoxVisible)}
                title={
                  isMessageBoxVisible
                    ? t.kiosk.hideMessages
                    : t.kiosk.showMessages
                }
              >
                {isMessageBoxVisible ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="20"
                    height="20"
                  >
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="20"
                    height="20"
                  >
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-3.31 0-6-2.69-6-6 0-.79.2-1.53.53-2.2z" />
                  </svg>
                )}
              </button>

              {/* Mic button */}
              <button
                className={[
                  "liya-ai-3d-avatar-react-kiosk__mic",
                  isRecording
                    ? "liya-ai-3d-avatar-react-kiosk__mic--active"
                    : "",
                  kioskMicDisabled
                    ? "liya-ai-3d-avatar-react-kiosk__mic--disabled"
                    : "",
                  !isVoiceSupported
                    ? "liya-ai-3d-avatar-react-kiosk__mic--not-supported"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={toggleKioskListening}
                disabled={kioskMicDisabled || !isVoiceSupported}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="32"
                  height="32"
                >
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              </button>
              <p className="liya-ai-3d-avatar-react-kiosk__hint">
                {isRecording
                  ? t.voice.listening
                  : kioskMicDisabled
                    ? kioskStatusText
                    : t.voice.speakToMic}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard widget layout
  return (
    <div
      className={`liya-ai-3d-avatar-react-widget liya-ai-3d-avatar-react-widget--${position}`}
      style={cssVars}
    >
      <button
        className={`liya-ai-3d-avatar-react-widget__toggle ${
          isOpen ? "liya-ai-3d-avatar-react-widget__toggle--open" : ""
        } ${animateButton && !isOpen ? "liya-ai-3d-avatar-react-widget__toggle--animated" : ""}`}
        onClick={toggle}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="liya-ai-3d-avatar-react-widget__panel">
          <div className="liya-ai-3d-avatar-react-widget__upper">
            <div className="liya-ai-3d-avatar-react-widget__avatar-container">
              <AvatarScene
                ref={avatarSceneRef}
                modelUrl={resolvedAvatarUrl}
                width={380}
                height={240}
                isSpeaking={isSpeaking}
                visemes={currentVisemes}
                currentTime={audioCurrentTime}
                backgroundColor="transparent"
                onLoaded={applyCurrentColors}
              />
            </div>

            {/* Liquid Glass Header Overlay */}
            <div className="liya-ai-3d-avatar-react-widget__header">
              <div className="liya-ai-3d-avatar-react-widget__header-info">
                <div className="liya-ai-3d-avatar-react-widget__header-avatar">
                  <svg viewBox="0 0 32 32" fill="none" width="20" height="20">
                    <path
                      d="M8 5 L8 20 L20 20"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <path
                      d="M22 3 L23.2 6 L26 7.2 L23.2 8.4 L22 12 L20.8 8.4 L18 7.2 L20.8 6 Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="liya-ai-3d-avatar-react-widget__header-text">
                  <h3 className="liya-ai-3d-avatar-react-widget__title">
                    {assistantName || "Assistant"}
                  </h3>
                  <span className="liya-ai-3d-avatar-react-widget__status">
                    <span
                      className={`liya-ai-3d-avatar-react-widget__status-dot ${
                        isPreparingSpeech
                          ? "liya-ai-3d-avatar-react-widget__status-dot--loading"
                          : ""
                      }`}
                    />
                    {isPreparingSpeech
                      ? t.widget.preparing
                      : isSpeaking
                        ? t.widget.speaking
                        : t.widget.online}
                  </span>
                </div>
              </div>

              {/* Replay/Cancel Button */}
              {lastSpokenText || isSpeaking ? (
                <button
                  className={`liya-ai-3d-avatar-react-widget__replay-btn ${
                    isSpeaking
                      ? "liya-ai-3d-avatar-react-widget__replay-btn--cancel"
                      : ""
                  }`}
                  onClick={handleReplayOrStop}
                  title={isSpeaking ? t.avatar.stop : t.avatar.replay}
                >
                  {isSpeaking ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      width="16"
                      height="16"
                    >
                      <path d="M6 6h12v12H6z" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      width="16"
                      height="16"
                    >
                      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                    </svg>
                  )}
                </button>
              ) : null}

              {/* Settings Button */}
              <button
                className={`liya-ai-3d-avatar-react-widget__settings-btn ${
                  isSettingsPanelOpen
                    ? "liya-ai-3d-avatar-react-widget__settings-btn--active"
                    : ""
                }`}
                onClick={() => setIsSettingsPanelOpen(!isSettingsPanelOpen)}
                title={t.settings.title}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="16"
                  height="16"
                >
                  <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                </svg>
              </button>

              {/* Language Toggle */}
              <button
                className="liya-ai-3d-avatar-react-widget__lang-btn"
                onClick={toggleLocale}
                title={
                  locale === "tr"
                    ? "Switch to English"
                    : locale === "en"
                      ? "切换到中文"
                      : "Türkçe'ye geç"
                }
              >
                <span>
                  {locale === "tr" ? "EN" : locale === "en" ? "ZH" : "TR"}
                </span>
              </button>

              {/* Close Button */}
              {closeButtonEnabled && (
                <button
                  className="liya-ai-3d-avatar-react-widget__close"
                  onClick={toggle}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="18"
                    height="18"
                  >
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Settings Panel */}
            {isSettingsPanelOpen && (
              <div className="liya-ai-3d-avatar-react-widget__settings-panel">
                <div className="liya-ai-3d-avatar-react-widget__settings-panel-header">
                  <h3 className="liya-ai-3d-avatar-react-widget__settings-panel-title">
                    {t.settings.outfitColors}
                  </h3>
                  <button
                    className="liya-ai-3d-avatar-react-widget__settings-panel-close"
                    onClick={() => setIsSettingsPanelOpen(false)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      width="16"
                      height="16"
                    >
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </button>
                </div>

                {/* Presets */}
                <div className="liya-ai-3d-avatar-react-widget__settings-panel-section">
                  <label className="liya-ai-3d-avatar-react-widget__settings-panel-label">
                    {t.settings.presets}
                  </label>
                  <div className="liya-ai-3d-avatar-react-widget__settings-panel-presets">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.id}
                        className={`liya-ai-3d-avatar-react-widget__settings-panel-preset ${
                          currentPresetId === preset.id
                            ? "liya-ai-3d-avatar-react-widget__settings-panel-preset--active"
                            : ""
                        }`}
                        style={{ background: preset.top }}
                        title={translate(preset.name)}
                        onClick={() => setPreset(preset.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                <div className="liya-ai-3d-avatar-react-widget__settings-panel-section">
                  <label className="liya-ai-3d-avatar-react-widget__settings-panel-label">
                    {t.settings.customColor}
                  </label>
                  <div className="liya-ai-3d-avatar-react-widget__settings-panel-colors">
                    <div className="liya-ai-3d-avatar-react-widget__settings-panel-color-row">
                      <span>{t.settings.top}</span>
                      <input
                        type="color"
                        value={avatarColors.top}
                        onChange={(e) => setColor("top", e.target.value)}
                      />
                    </div>
                    <div className="liya-ai-3d-avatar-react-widget__settings-panel-color-row">
                      <span>{t.settings.bottom}</span>
                      <input
                        type="color"
                        value={avatarColors.bottom}
                        onChange={(e) => setColor("bottom", e.target.value)}
                      />
                    </div>
                    <div className="liya-ai-3d-avatar-react-widget__settings-panel-color-row">
                      <span>{t.settings.footwear}</span>
                      <input
                        type="color"
                        value={avatarColors.footwear}
                        onChange={(e) => setColor("footwear", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Reset Button */}
                <button
                  className="liya-ai-3d-avatar-react-widget__settings-panel-reset"
                  onClick={resetColors}
                >
                  {t.settings.reset}
                </button>
              </div>
            )}
          </div>

          {/* Lower Section: Chat */}
          <div className="liya-ai-3d-avatar-react-widget__lower">
            <MessageList
              messages={messages}
              isLoading={isLoading}
              assistantName={assistantName}
              welcomeMessage={welcomeMessage || t.chat.welcomeMessage}
              welcomeSuggestions={
                welcomeSuggestions.length > 0
                  ? welcomeSuggestions
                  : t.chat.welcomeSuggestions
              }
              preparingText={
                isLoading ? t.preparingMessages[preparingMessageIndex] : ""
              }
              onSuggestionClick={handleSuggestionClick}
            />

            <ChatInput
              onSend={handleSend}
              disabled={isLoading}
              showVoice={showVoice}
              voiceEnabled={voiceEnabled}
              showFileUpload={showFileUpload}
              sessionId={currentSessionId}
            />

            {/* Branding */}
            {showBranding && (
              <div className="liya-ai-3d-avatar-react-widget__branding">
                {t.branding?.poweredBy || "Powered by"}{" "}
                <a href="https://liyalabs.com" target="_blank" rel="noopener">
                  Liya AI
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
