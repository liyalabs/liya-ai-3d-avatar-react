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
// Liya AI Chat - useChat Hook (React Version)
import { useState, useCallback, useEffect, useMemo } from "react";
import type { Message, SendMessageResponse } from "../types";
import { sendMessage as apiSendMessage, getSessionHistory } from "../api";

// Global state for chat to keep it synced across components
let globalMessages: Message[] = [];
let globalIsLoading = false;
let globalError: string | null = null;
let globalCurrentSessionId: string | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function useChat() {
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick((tick) => tick + 1), []);

  useEffect(() => {
    listeners.add(forceUpdate);
    return () => {
      listeners.delete(forceUpdate);
    };
  }, [forceUpdate]);

  const hasMessages = globalMessages.length > 0;
  const lastMessage = globalMessages[globalMessages.length - 1] ?? null;

  // LocalStorage helpers
  const storageKey = "liya-ai-3d-avatar-react-session-id";
  const timestampKey = "liya-ai-3d-avatar-react-session-timestamp";
  const SESSION_CACHE_DURATION_MS = 60 * 60 * 1000; // 60 minutes

  const saveSessionToStorage = useCallback((sessionId: string): void => {
    try {
      localStorage.setItem(storageKey, sessionId);
      localStorage.setItem(timestampKey, Date.now().toString());
    } catch {}
  }, []);

  const clearSessionFromStorage = useCallback((): void => {
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(timestampKey);
    } catch {}
  }, []);

  const sendMessage = useCallback(
    async (
      content: string,
      fileIds?: string[],
    ): Promise<SendMessageResponse | null> => {
      if (!content.trim()) return null;

      globalIsLoading = true;
      globalError = null;
      notify();

      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        content: content.trim(),
        role: "user",
        created_at: new Date().toISOString(),
      };
      globalMessages = [...globalMessages, tempUserMessage];
      notify();

      try {
        const response = await apiSendMessage(
          content.trim(),
          globalCurrentSessionId || undefined,
          fileIds,
        );

        if (response.session_id) {
          globalCurrentSessionId = response.session_id;
          saveSessionToStorage(response.session_id);
        }

        if (response.user_message) {
          globalMessages = globalMessages.map((m) =>
            m.id === tempUserMessage.id ? response.user_message! : m,
          );
        }

        if (response.assistant_message) {
          let assistantMsg = { ...response.assistant_message };
          if (response.suggestions && response.suggestions.length > 0) {
            try {
              const contentObj = JSON.parse(assistantMsg.content);
              if (!contentObj.suggestions)
                contentObj.suggestions = response.suggestions;
              assistantMsg.content = JSON.stringify(contentObj);
            } catch {
              assistantMsg.content = JSON.stringify({
                response: assistantMsg.content,
                suggestions: response.suggestions,
              });
            }
          }
          if (response.media && response.media.length > 0) {
            assistantMsg.media = response.media as any;
          }
          globalMessages = [...globalMessages, assistantMsg];
        } else if (response.response) {
          let messageContent = response.response;
          if (response.suggestions && response.suggestions.length > 0) {
            messageContent = JSON.stringify({
              response: response.response,
              suggestions: response.suggestions,
            });
          }
          globalMessages = [
            ...globalMessages,
            {
              id: response.message_id || `msg-${Date.now()}`,
              content: messageContent,
              role: "assistant",
              created_at: new Date().toISOString(),
              response_time: response.response_time,
              media: response.media,
            },
          ];
        }
        notify();
        return response;
      } catch (err) {
        globalError =
          err instanceof Error ? err.message : "Failed to send message";
        globalMessages = globalMessages.filter(
          (m) => m.id !== tempUserMessage.id,
        );
        notify();
        return null;
      } finally {
        globalIsLoading = false;
        notify();
      }
    },
    [saveSessionToStorage],
  );

  const loadHistory = useCallback(
    async (sessionId: string): Promise<void> => {
      globalIsLoading = true;
      globalError = null;
      notify();

      try {
        const response = await getSessionHistory(sessionId);
        globalMessages = response.messages;
        globalCurrentSessionId = sessionId;
        saveSessionToStorage(sessionId);
      } catch (err) {
        globalError =
          err instanceof Error ? err.message : "Failed to load history";
        globalCurrentSessionId = null;
        clearSessionFromStorage();
      } finally {
        globalIsLoading = false;
        notify();
      }
    },
    [saveSessionToStorage, clearSessionFromStorage],
  );

  const clearMessages = useCallback((): void => {
    globalMessages = [];
    globalCurrentSessionId = null;
    clearSessionFromStorage();
    notify();
  }, [clearSessionFromStorage]);

  const addWelcomeMessage = useCallback((welcomeText: string): void => {
    if (globalMessages.length === 0) {
      globalMessages = [
        {
          id: `welcome-${Date.now()}`,
          content: welcomeText,
          role: "assistant",
          created_at: new Date().toISOString(),
        },
      ];
      notify();
    }
  }, []);

  const updateWelcomeMessage = useCallback((newText: string): void => {
    if (
      globalMessages.length > 0 &&
      globalMessages[0].id.startsWith("welcome-")
    ) {
      globalMessages = [
        { ...globalMessages[0], content: newText },
        ...globalMessages.slice(1),
      ];
      notify();
    }
  }, []);

  const getStoredSessionId = useCallback((): string | null => {
    try {
      const sessionId = localStorage.getItem(storageKey);
      const timestamp = localStorage.getItem(timestampKey);
      if (!sessionId || !timestamp) return null;
      const sessionAge = Date.now() - parseInt(timestamp, 10);
      if (sessionAge > SESSION_CACHE_DURATION_MS) {
        clearSessionFromStorage();
        return null;
      }
      return sessionId;
    } catch {
      return null;
    }
  }, [clearSessionFromStorage]);

  const initFromStorage = useCallback((): void => {
    const storedSessionId = getStoredSessionId();
    if (storedSessionId) {
      globalCurrentSessionId = storedSessionId;
      notify();
    }
  }, [getStoredSessionId]);

  const setSessionId = useCallback(
    (sessionId: string | null): void => {
      globalCurrentSessionId = sessionId;
      if (sessionId) {
        saveSessionToStorage(sessionId);
      } else {
        clearSessionFromStorage();
      }
      notify();
    },
    [saveSessionToStorage, clearSessionFromStorage],
  );

  return {
    messages: globalMessages,
    isLoading: globalIsLoading,
    error: globalError,
    currentSessionId: globalCurrentSessionId,
    hasMessages,
    lastMessage,
    sendMessage,
    loadHistory,
    clearMessages,
    addWelcomeMessage,
    updateWelcomeMessage,
    initFromStorage,
    getStoredSessionId,
    setSessionId,
  };
}
