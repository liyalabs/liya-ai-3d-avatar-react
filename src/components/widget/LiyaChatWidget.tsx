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
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import type { ThemeConfig } from "../../types";
import { useChat } from "../../hooks/useChat";
import { getConfig } from "../../api";
import { MessageList, ChatInput } from "../shared";
import { AvatarScene } from "../avatar";
import { useAvatarColors } from "../../hooks/useAvatarColors";
import { useI18n } from "../../hooks/useI18n";
import { adjustColor } from "../../utils/color";
import "./LiyaChatWidget.css";

export interface LiyaChatWidgetProps {
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
  customIcon?: string;
  autoSpeak?: boolean;
  animateButton?: boolean;
  viewOnPageStart?: boolean;
  liyaWidgetMode?: "standard" | "kiosk" | "modal_kiosk";
  closeButtonEnabled?: boolean;
  locale?: string;
  onOpened?: () => void;
  onClosed?: () => void;
  onMessageSent?: (message: string) => void;
  onMessageReceived?: (message: string) => void;
}

export default function LiyaChatWidget({
  position = "bottom-right",
  theme = {},
  assistantName: propAssistantName = "",
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
  customIcon,
  autoSpeak = true,
  animateButton = true,
  viewOnPageStart = false,
  liyaWidgetMode = "standard",
  closeButtonEnabled = true,
  locale: propLocale = "",
  onOpened,
  onClosed,
  onMessageSent,
  onMessageReceived,
}: LiyaChatWidgetProps) {
  const config = getConfig();
  const { t, translate, locale, initLocale, setLocale } = useI18n();
  const {
    messages,
    isLoading,
    currentSessionId,
    sendMessage,
    initFromStorage,
    loadHistory,
    addWelcomeMessage,
    clearMessages,
    uploadFiles,
    clearFiles,
  } = useChat();
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
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [isAvatarVisible, setIsAvatarVisible] = useState(
    liyaWidgetMode !== "standard",
  );
  const [backendAvatarUrl, setBackendAvatarUrl] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPreparingSpeech, setIsPreparingSpeech] = useState(false);
  const [currentVisemes, setCurrentVisemes] = useState<any[]>([]);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [lastSpokenText, setLastSpokenText] = useState("");
  const [preparingMessageIndex, setPreparingMessageIndex] = useState(0);
  const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false);

  // Refs
  const avatarSceneRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const preparingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const assistantName =
    propAssistantName || config.assistantName || "Assistant";

  // Fetch avatar model from backend
  const fetchModel = useCallback(async () => {
    if (avatarModelUrl || config.avatarModelUrl) return;
    try {
      const { getAvatarModel } = await import("../../api/avatar");
      const res = await getAvatarModel(config.assistantId);
      setBackendAvatarUrl(res.model_url);
    } catch {
      // Silent fail
    }
  }, [avatarModelUrl, config.avatarModelUrl, config.assistantId]);

  // Initialize
  useEffect(() => {
    initLocale(propLocale || config.locale || "tr");
    initFromStorage();
    if (currentSessionId) loadHistory(currentSessionId);
    fetchModel();
  }, []);

  const resolvedAvatarUrl =
    avatarModelUrl || config.avatarModelUrl || backendAvatarUrl;

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
      } catch {
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
          `${config.apiUrl}/api/v1/external/avatar/speech/`,
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
      } catch {
        setIsPreparingSpeech(false);
      }
    },
    [config.apiUrl, config.apiKey, playAudio],
  );

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

  // Preparing messages rotation
  useEffect(() => {
    if (isLoading || isPreparingSpeech) {
      setPreparingMessageIndex(0);
      const now = Date.now();
      preparingTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - now;
        if (elapsed > 8000) {
          setPreparingMessageIndex(
            (prev) => (prev + 1) % t.preparingMessages.length,
          );
        }
      }, 4000);
    } else {
      if (preparingTimerRef.current) {
        clearInterval(preparingTimerRef.current);
        preparingTimerRef.current = null;
      }
      setPreparingMessageIndex(0);
    }
    return () => {
      if (preparingTimerRef.current) clearInterval(preparingTimerRef.current);
    };
  }, [isLoading, isPreparingSpeech, t.preparingMessages.length]);

  // Handle send
  const handleSend = useCallback(
    async (message: string, fileIds?: string[]) => {
      if (!message.trim() && (!fileIds || fileIds.length === 0)) return;

      let uploadedFileIds = fileIds;
      if (currentSessionId && fileIds && fileIds.length > 0) {
        const uploaded = await uploadFiles(currentSessionId);
        uploadedFileIds = uploaded.map((f: any) => f.id);
      }

      onMessageSent?.(message);
      const response = await sendMessage(message, uploadedFileIds);

      if (response?.assistant_message?.content || response?.response) {
        const text =
          response.assistant_message?.content || response.response || "";
        onMessageReceived?.(text);
      }

      clearFiles();
    },
    [
      currentSessionId,
      uploadFiles,
      sendMessage,
      clearFiles,
      onMessageSent,
      onMessageReceived,
    ],
  );

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSend(suggestion);
    },
    [handleSend],
  );

  // Open widget
  const openWidget = useCallback(() => {
    if (!isOpen) {
      setIsOpen(true);
      onOpened?.();
    }
    if (!hasPlayedWelcome && welcomeMessage) {
      setHasPlayedWelcome(true);
      addWelcomeMessage(welcomeMessage);
    }
  }, [isOpen, onOpened, hasPlayedWelcome, welcomeMessage, addWelcomeMessage]);

  // Close widget
  const closeWidget = useCallback(() => {
    if (!isOpen) return;
    clearMessages();
    setIsOpen(false);
    onClosed?.();
  }, [isOpen, clearMessages, onClosed]);

  // Toggle widget
  const toggleWidget = useCallback(() => {
    if (isOpen) {
      closeWidget();
    } else {
      openWidget();
    }
  }, [isOpen, closeWidget, openWidget]);

  // Toggle locale
  const toggleLocale = useCallback(() => {
    setLocale(locale === "tr" ? "en" : "tr");
  }, [locale, setLocale]);

  const nextLocaleLabel = locale === "tr" ? "EN" : "TR";

  // Handle replay or stop
  const handleReplayOrStop = useCallback(() => {
    if (isSpeaking && audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch {
        /* ignore */
      }
      setIsSpeaking(false);
      setAudioCurrentTime(0);
      setCurrentVisemes([]);
    } else if (lastSpokenText) {
      speak(lastSpokenText);
    }
  }, [isSpeaking, lastSpokenText, speak]);

  // CSS variables
  const cssVars = useMemo(() => {
    const primary = theme.primaryColor || "#6366f1";
    const bgColor = theme.backgroundColor || "#ffffff";
    const textColor = theme.textColor || "#374151";
    return {
      "--liya-primary-color": primary,
      "--liya-primary-hover": adjustColor(primary, -10),
      "--liya-secondary-color": theme.secondaryColor || "#e5e7eb",
      "--liya-bg-color": bgColor,
      "--liya-text-color": textColor,
      "--liya-text-muted": "#9ca3af",
      "--liya-border-color": "#e5e7eb",
      "--liya-border-radius": theme.borderRadius || "16px",
      "--liya-font-family":
        theme.fontFamily || "system-ui, -apple-system, sans-serif",
      "--liya-z-index": theme.zIndex || 9999,
      "--liya-offset-x": `${offsetX}px`,
      "--liya-offset-y": `${offsetY}px`,
    } as React.CSSProperties;
  }, [theme, offsetX, offsetY]);

  // Status text
  const standardStatusText =
    isPreparingSpeech || isLoading
      ? t.preparingMessages[preparingMessageIndex]
      : isSpeaking
        ? t.widget.speaking
        : t.widget.online;

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    setIsSpeaking(false);
    setAudioCurrentTime(0);
    setCurrentVisemes([]);
    setIsPreparingSpeech(false);
  }, []);

  const hasAvatar = showAvatarButton && resolvedAvatarUrl;

  return (
    <div
      className={`liya-ai-3d-avatar-react-widget liya-ai-3d-avatar-react-widget--${position}`}
      style={cssVars}
    >
      {/* Toggle Button */}
      <button
        className={`liya-ai-3d-avatar-react-widget__toggle ${
          isOpen ? "liya-ai-3d-avatar-react-widget__toggle--open" : ""
        } ${animateButton && !isOpen ? "liya-ai-3d-avatar-react-widget__toggle--animated" : ""}`}
        onClick={toggleWidget}
        aria-label={isOpen ? "Sohbeti kapat" : "Sohbeti aç"}
      >
        {!isOpen ? (
          <div className="liya-ai-3d-avatar-react-widget__toggle-icon">
            <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
              <path
                d="M10 6 L10 22 L22 22"
                stroke="rgba(255,255,255,0.95)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M24 4 L25.5 7.5 L29 9 L25.5 10.5 L24 14 L22.5 10.5 L19 9 L22.5 7.5 Z"
                fill="rgba(255,255,255,0.95)"
              />
              <path
                d="M26 16 L27 18 L29 19 L27 20 L26 22 L25 20 L23 19 L25 18 Z"
                fill="rgba(255,255,255,0.8)"
              />
              <path
                d="M16 2 L16.8 4 L19 4.8 L16.8 5.6 L16 8 L15.2 5.6 L13 4.8 L15.2 4 Z"
                fill="rgba(255,255,255,0.7)"
              />
            </svg>
            <span className="liya-ai-3d-avatar-react-widget__toggle-sparkle"></span>
          </div>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className={`liya-ai-3d-avatar-react-widget__panel ${hasAvatar ? "" : "liya-ai-3d-avatar-react-widget__panel--no-avatar"}`}
        >
          {hasAvatar ? (
            <>
              {/* Upper Section: Avatar with Liquid Glass Header */}
              <div className="liya-ai-3d-avatar-react-widget__upper">
                {/* Avatar Scene */}
                <div className="liya-ai-3d-avatar-react-widget__avatar-container">
                  {showAvatarButton && resolvedAvatarUrl && (
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
                  )}
                </div>

                {/* Liquid Glass Header (Overlay) */}
                <div className="liya-ai-3d-avatar-react-widget__header">
                  <div className="liya-ai-3d-avatar-react-widget__header-info">
                    <div className="liya-ai-3d-avatar-react-widget__header-avatar">
                      <svg
                        viewBox="0 0 32 32"
                        fill="none"
                        width="20"
                        height="20"
                      >
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
                        <path
                          d="M25 14 L25.8 16 L28 16.8 L25.8 17.6 L25 20 L24.2 17.6 L22 16.8 L24.2 16 Z"
                          fill="currentColor"
                          opacity="0.7"
                        />
                      </svg>
                    </div>
                    <div className="liya-ai-3d-avatar-react-widget__header-text">
                      <h3 className="liya-ai-3d-avatar-react-widget__title">
                        {assistantName}
                      </h3>
                      <span className="liya-ai-3d-avatar-react-widget__status">
                        <span
                          className={`liya-ai-3d-avatar-react-widget__status-dot ${
                            isPreparingSpeech || isLoading
                              ? "liya-ai-3d-avatar-react-widget__status-dot--loading"
                              : isSpeaking
                                ? "liya-ai-3d-avatar-react-widget__status-dot--speaking"
                                : ""
                          }`}
                        />
                        {standardStatusText}
                      </span>
                    </div>
                  </div>

                  {/* Replay/Cancel Button */}
                  {(lastSpokenText || isSpeaking) && (
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
                  )}

                  {/* Settings Button */}
                  {showAvatarButton && (
                    <button
                      className={`liya-ai-3d-avatar-react-widget__settings-btn ${
                        isSettingsPanelOpen
                          ? "liya-ai-3d-avatar-react-widget__settings-btn--active"
                          : ""
                      }`}
                      onClick={() =>
                        setIsSettingsPanelOpen(!isSettingsPanelOpen)
                      }
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
                  )}

                  {/* Language Toggle */}
                  <button
                    className="liya-ai-3d-avatar-react-widget__lang-btn"
                    onClick={toggleLocale}
                    title={`Switch to ${nextLocaleLabel}`}
                  >
                    <span>{nextLocaleLabel}</span>
                  </button>

                  {/* Close Button */}
                  {closeButtonEnabled && (
                    <button
                      className="liya-ai-3d-avatar-react-widget__close"
                      onClick={toggleWidget}
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
                            onChange={(e) =>
                              setColor("footwear", e.target.value)
                            }
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
            </>
          ) : (
            <div className="liya-ai-3d-avatar-react-widget__no-avatar">
              <div className="liya-ai-3d-avatar-react-widget__no-avatar-icon">
                <svg viewBox="0 0 64 64" fill="none" width="48" height="48">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.3"
                  />
                  <circle
                    cx="32"
                    cy="26"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.4"
                  />
                  <path
                    d="M16 50c0-8.84 7.16-16 16-16s16 7.16 16 16"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.3"
                  />
                </svg>
              </div>
              <div className="liya-ai-3d-avatar-react-widget__no-avatar-text">
                <h3>{assistantName}</h3>
                <span className="liya-ai-3d-avatar-react-widget__status">
                  <span className="liya-ai-3d-avatar-react-widget__status-dot" />
                  {standardStatusText}
                </span>
              </div>
            </div>
          )}

          {/* Lower Section: Chat */}
          <div className="liya-ai-3d-avatar-react-widget__lower">
            <MessageList
              messages={messages}
              isLoading={isLoading}
              assistantName={assistantName}
              welcomeMessage={welcomeMessage}
              welcomeSuggestions={welcomeSuggestions}
              preparingText={
                isLoading ? t.preparingMessages[preparingMessageIndex] : ""
              }
              onSuggestionClick={handleSuggestionClick}
            />

            <ChatInput
              placeholder={placeholder || t.chat.placeholder}
              disabled={isLoading}
              showVoice={showVoice}
              voiceEnabled={voiceEnabled}
              showFileUpload={showFileUpload}
              sessionId={currentSessionId}
              onSend={handleSend}
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
