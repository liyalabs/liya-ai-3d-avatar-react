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
import React, { useState, useEffect, useMemo } from "react";
import type { ThemeConfig } from "../../types";
import { useChat } from "../../hooks/useChat";
import { getConfig, initializeClient, isInitialized } from "../../api";
import { MessageList, ChatInput } from "../shared";
import { adjustColor } from "../../utils/color";
import "./LiyaChatWidget.css";

export interface LiyaChatWidgetProps {
  apiKey?: string;
  baseUrl?: string;
  assistantId?: string;
  assistantName?: string;
  position?: ThemeConfig["position"];
  theme?: ThemeConfig;
  welcomeMessage?: string;
  placeholder?: string;
  showBranding?: boolean;
  showVoice?: boolean;
  voiceEnabled?: boolean;
  showFileUpload?: boolean;
  offsetX?: number;
  offsetY?: number;
  onOpened?: () => void;
  onClosed?: () => void;
  onMessageSent?: (message: string) => void;
  onMessageReceived?: (message: string) => void;
}

export default function LiyaChatWidgetWrapper(props: LiyaChatWidgetProps) {
  if (props.apiKey && props.baseUrl && props.assistantId && !isInitialized()) {
    initializeClient({
      apiKey: props.apiKey,
      baseUrl: props.baseUrl,
      assistantId: props.assistantId,
      mode: "widget",
      assistantName: props.assistantName || "",
      theme: props.theme || {},
    });
  }

  if (!isInitialized()) {
    return (
      <div
        style={{ display: "none" }}
        data-error="LiyaChatWidget requires apiKey, baseUrl, and assistantId to be initialized."
      />
    );
  }

  return <LiyaChatWidget {...props} />;
}

function LiyaChatWidget({
  apiKey,
  baseUrl,
  assistantId,
  assistantName: propAssistantName = "",
  position = "bottom-right",
  theme = {},
  welcomeMessage = "Bu chat hizmeti Liya AI tarafından sağlanmaktadır. Size bugün nasıl yardımcı olabilirim?",
  placeholder = "Mesajınızı yazın...",
  showBranding = true,
  showVoice = true,
  voiceEnabled = true,
  showFileUpload = true,
  offsetX = 20,
  offsetY = 20,
  onOpened,
  onClosed,
  onMessageSent,
  onMessageReceived,
}: LiyaChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const config = getConfig();

  const {
    messages,
    isLoading,
    currentSessionId,
    sendMessage,
    initFromStorage,
    loadHistory,
  } = useChat();

  const assistantName = config.assistantName || "Assistant";

  const positionClass = `liya-ai-3d-avatar-react-widget--${position}`;

  const cssVars = useMemo(() => {
    const primary = theme.primaryColor || "#6366f1";
    return {
      "--liya-primary-color": primary,
      "--liya-primary-hover": adjustColor(primary, -10),
      "--liya-secondary-color": theme.secondaryColor || "#e5e7eb",
      "--liya-bg-color": theme.backgroundColor || "#ffffff",
      "--liya-text-color": theme.textColor || "#374151",
      "--liya-border-radius": theme.borderRadius || "16px",
      "--liya-font-family":
        theme.fontFamily || "system-ui, -apple-system, sans-serif",
      "--liya-z-index": theme.zIndex || 9999,
      "--liya-offset-x": `${offsetX}px`,
      "--liya-offset-y": `${offsetY}px`,
    } as React.CSSProperties;
  }, [theme, offsetX, offsetY]);

  const toggleWidget = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) onOpened?.();
    else onClosed?.();
  };

  const handleSend = async (message: string) => {
    if (!message.trim()) return;
    onMessageSent?.(message);
    const response = await sendMessage(message);
    if (response?.assistant_message?.content || response?.response) {
      onMessageReceived?.(
        response.assistant_message?.content || response.response || "",
      );
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  useEffect(() => {
    initFromStorage();
    if (currentSessionId) {
      loadHistory(currentSessionId);
    }
  }, []); // Init once

  return (
    <div
      className={`liya-ai-3d-avatar-react-widget ${positionClass}`}
      style={cssVars}
    >
      {/* Toggle Button */}
      <button
        className={`liya-ai-3d-avatar-react-widget__toggle ${isOpen ? "liya-ai-3d-avatar-react-widget__toggle--open" : ""}`}
        onClick={toggleWidget}
        aria-label={isOpen ? "Sohbeti kapat" : "Sohbeti aç"}
      >
        {!isOpen ? (
          <svg viewBox="0 0 80 92" fill="none" width="28" height="28">
            <rect
              x="0"
              y="0"
              width="80"
              height="80"
              rx="18"
              fill="currentColor"
            />
            <path d="M22 80 L34 80 L28 92 Z" fill="currentColor" />
            <path
              d="M36 26 V58 H56"
              stroke="#FFFFFF"
              stroke-width="5"
              stroke-linecap="round"
            />
            <circle cx="36" cy="26" r="3" fill="#FFFFFF" />
            <circle cx="36" cy="58" r="3" fill="#FFFFFF" />
            <circle cx="56" cy="58" r="3" fill="#FFFFFF" />
            <text
              x="40"
              y="52"
              fontSize="12"
              fontWeight="600"
              fontFamily="system-ui, sans-serif"
              fill="#FFFFFF"
            >
              ai
            </text>
            <path
              d="M58 16 L60 20 L64 22 L60 24 L58 28 L56 24 L52 22 L56 20 Z"
              fill="#FFFFFF"
            />
            <path
              d="M66 30 L67.5 33 L71 34.5 L67.5 36 L66 39 L64.5 36 L61 34.5 L64.5 33 Z"
              fill="#FFFFFF"
            />
            <path
              d="M50 18 L51.5 21 L55 22.5 L51.5 24 L50 27 L48.5 24 L45 22.5 L48.5 21 Z"
              fill="#FFFFFF"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`liya-ai-3d-avatar-react-widget__panel ${isOpen ? "liya-ai-3d-avatar-react-widget__panel--open" : ""}`}
      >
        {/* Header */}
        <div className="liya-ai-3d-avatar-react-widget__header">
          <div className="liya-ai-3d-avatar-react-widget__header-info">
            <div className="liya-ai-3d-avatar-react-widget__avatar">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="24"
                height="24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
            <div className="liya-ai-3d-avatar-react-widget__header-text">
              <h3 className="liya-ai-3d-avatar-react-widget__title">
                {assistantName}
              </h3>
              <span className="liya-ai-3d-avatar-react-widget__status">
                Çevrimiçi
              </span>
            </div>
          </div>
          <button
            className="liya-ai-3d-avatar-react-widget__close"
            onClick={toggleWidget}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <MessageList
          messages={messages}
          isLoading={isLoading}
          assistantName={assistantName}
          welcomeMessage={welcomeMessage}
          onSuggestionClick={handleSuggestionClick}
        />

        {/* Input */}
        <ChatInput
          placeholder={placeholder}
          disabled={isLoading}
          showVoice={showVoice}
          voiceEnabled={voiceEnabled}
          sessionId={currentSessionId}
          onSend={handleSend}
        />

        {/* Branding */}
        {showBranding && (
          <div className="liya-ai-3d-avatar-react-widget__branding">
            Powered by{" "}
            <a href="https://liyalabs.com" target="_blank" rel="noopener">
              Liya AI
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
