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
import type { ThemeConfig, Session } from "../../types";
import { useChat } from "../../hooks/useChat";
import { useSessions } from "../../hooks/useSessions";
import { useI18n } from "../../hooks/useI18n";
import { getConfig, initializeClient, isInitialized } from "../../api";
import { MessageList, ChatInput } from "../shared";
import SessionSidebar from "./SessionSidebar";
import { adjustColor } from "../../utils/color";
import "./LiyaChatApp.css";

export interface LiyaChatAppProps {
  apiKey?: string;
  baseUrl?: string;
  assistantId?: string;
  assistantName?: string;
  theme?: ThemeConfig;
  showSidebar?: boolean;
  sidebarWidth?: string;
  welcomeMessage?: string;
  placeholder?: string;
  showVoice?: boolean;
  voiceEnabled?: boolean;
  showFileUpload?: boolean;
  onSessionCreated?: (session: Session) => void;
  onSessionSelected?: (session: Session) => void;
  onSessionDeleted?: (sessionId: string) => void;
  onMessageSent?: (message: string) => void;
  onMessageReceived?: (message: string) => void;
}

export default function LiyaChatAppWrapper(props: LiyaChatAppProps) {
  if (props.apiKey && props.baseUrl && props.assistantId && !isInitialized()) {
    initializeClient({
      apiKey: props.apiKey,
      baseUrl: props.baseUrl,
      assistantId: props.assistantId,
      mode: "app",
      assistantName: props.assistantName || "",
      theme: props.theme || {},
    });
  }

  if (!isInitialized()) {
    return (
      <div
        style={{ display: "none" }}
        data-error="LiyaChatApp requires apiKey, baseUrl, and assistantId to be initialized."
      />
    );
  }

  return <LiyaChatApp {...props} />;
}

function LiyaChatApp({
  apiKey,
  baseUrl,
  assistantId,
  assistantName: propAssistantName = "",
  theme = {},
  showSidebar = true,
  sidebarWidth = "300px",
  welcomeMessage = "",
  placeholder = "Mesajınızı yazın...",
  showVoice = true,
  voiceEnabled = true,
  showFileUpload = true,
  onSessionCreated,
  onSessionSelected,
  onSessionDeleted,
  onMessageSent,
  onMessageReceived,
}: LiyaChatAppProps) {
  const config = getConfig();
  const { locale } = useI18n();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const {
    messages,
    isLoading: isChatLoading,
    currentSessionId,
    sendMessage,
    loadHistory,
    clearMessages,
    setSessionId,
  } = useChat();

  const {
    sessions,
    currentSession,
    isLoading: isSessionsLoading,
    loadSessions,
    createSession,
    deleteSession,
    selectSession,
  } = useSessions();

  const assistantName = config.assistantName || "Assistant";

  const cssVars = useMemo(() => {
    const primary = theme.primaryColor || "#6366f1";
    return {
      "--liya-primary-color": primary,
      "--liya-primary-hover": adjustColor(primary, -10),
      "--liya-secondary-color": theme.secondaryColor || "#e5e7eb",
      "--liya-bg-color": theme.backgroundColor || "#ffffff",
      "--liya-bg-secondary": "#f3f4f6",
      "--liya-text-color": theme.textColor || "#374151",
      "--liya-text-muted": "#9ca3af",
      "--liya-border-color": "#e5e7eb",
      "--liya-border-radius": theme.borderRadius || "12px",
      "--liya-font-family":
        theme.fontFamily || "system-ui, -apple-system, sans-serif",
      "--liya-sidebar-width": sidebarWidth,
    } as React.CSSProperties;
  }, [theme, sidebarWidth]);

  const handleSelectSession = async (session: Session) => {
    selectSession(session);
    setSessionId(session.id);
    await loadHistory(session.id);
    setIsMobileSidebarOpen(false);
    onSessionSelected?.(session);
  };

  const handleCreateSession = async () => {
    const session = await createSession();
    if (session) {
      selectSession(session);
      setSessionId(session.id);
      clearMessages();
      setIsMobileSidebarOpen(false);
      onSessionCreated?.(session);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const success = await deleteSession(sessionId);
    if (success) {
      if (currentSessionId === sessionId) {
        clearMessages();
        setSessionId(null);
        selectSession(null);
      }
      onSessionDeleted?.(sessionId);
    }
  };

  const handleSend = async (message: string) => {
    if (!message.trim()) return;

    // Create session if none exists
    if (!currentSessionId) {
      const session = await createSession(message.substring(0, 30));
      if (session) {
        selectSession(session);
        setSessionId(session.id);
        onSessionCreated?.(session);
      }
    }

    onMessageSent?.(message);
    const response = await sendMessage(message, undefined, locale);
    if (response?.assistant_message?.content || response?.response) {
      onMessageReceived?.(
        response.assistant_message?.content || response.response || "",
      );
    }

    // Refresh sessions list
    loadSessions();
  };

  useEffect(() => {
    loadSessions();
  }, []);

  return (
    <div className="liya-ai-3d-avatar-react-app" style={cssVars}>
      {/* Mobile Header */}
      <div className="liya-ai-3d-avatar-react-app__mobile-header">
        <button
          className="liya-ai-3d-avatar-react-app__menu-btn"
          onClick={() => setIsMobileSidebarOpen(true)}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </button>
        <span className="liya-ai-3d-avatar-react-app__mobile-title">
          {currentSession?.session_name || assistantName}
        </span>
        <button
          className="liya-ai-3d-avatar-react-app__new-btn"
          onClick={handleCreateSession}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <aside
          className={`liya-ai-3d-avatar-react-app__sidebar ${isMobileSidebarOpen ? "liya-ai-3d-avatar-react-app__sidebar--open" : ""}`}
        >
          <SessionSidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            isLoading={isSessionsLoading}
            assistantName={assistantName}
            onSelectSession={handleSelectSession}
            onCreateSession={handleCreateSession}
            onDeleteSession={handleDeleteSession}
          />
        </aside>
      )}

      {/* Overlay for mobile */}
      {isMobileSidebarOpen && (
        <div
          className="liya-ai-3d-avatar-react-app__overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}

      {/* Main Chat Area */}
      <main className="liya-ai-3d-avatar-react-app__main">
        {/* Chat Header */}
        <div className="liya-ai-3d-avatar-react-app__header">
          <div className="liya-ai-3d-avatar-react-app__header-info">
            <div className="liya-ai-3d-avatar-react-app__avatar">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="24"
                height="24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
            <div className="liya-ai-3d-avatar-react-app__header-text">
              <h2 className="liya-ai-3d-avatar-react-app__title">
                {currentSession?.session_name || assistantName}
              </h2>
              <span className="liya-ai-3d-avatar-react-app__status">
                {currentSession
                  ? `${currentSession.message_count} mesaj`
                  : "Yeni sohbet başlatın"}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <MessageList
          messages={messages}
          isLoading={isChatLoading}
          assistantName={assistantName}
          welcomeMessage={welcomeMessage}
        />

        {/* Input */}
        <ChatInput
          placeholder={placeholder}
          disabled={isChatLoading}
          showVoice={showVoice}
          voiceEnabled={voiceEnabled}
          sessionId={currentSessionId}
          onSend={handleSend}
        />
      </main>
    </div>
  );
}
