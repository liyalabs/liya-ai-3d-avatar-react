import { useState, useCallback, useRef } from 'react';
import { sendMessage, sendMessageWithFiles } from '../api/chat';
import type { Message } from '../types';

const STORAGE_KEY = 'liya_avatar_session';
const SESSION_TTL_MS = 60 * 60 * 1000;

function getStoredSession(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { sessionId: string; ts: number };
    if (Date.now() - parsed.ts > SESSION_TTL_MS) { localStorage.removeItem(STORAGE_KEY); return null; }
    return parsed.sessionId;
  } catch { return null; }
}

export function useChat(assistantId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(getStoredSession());

  const addWelcomeMessage = useCallback((text: string) => {
    setMessages([{ id: 'welcome', role: 'assistant', content: text, createdAt: new Date().toISOString() }]);
  }, []);

  const send = useCallback(async (text: string, fileIds?: string[]) => {
    setError(null);
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, role: 'user', content: text, createdAt: new Date().toISOString(), isTemp: true }]);
    setIsLoading(true);
    try {
      const res = fileIds?.length
        ? await sendMessageWithFiles(text, fileIds, sessionIdRef.current, assistantId)
        : await sendMessage(text, sessionIdRef.current, assistantId);
      sessionIdRef.current = res.sessionId;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId: res.sessionId, ts: Date.now() }));
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        { id: `user-${Date.now()}`, role: 'user', content: text, createdAt: new Date().toISOString() },
        { id: `ai-${Date.now()}`, role: 'assistant', content: res.message, createdAt: new Date().toISOString() },
      ]);
      return res;
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [assistantId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    sessionIdRef.current = null;
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { messages, isLoading, error, sessionId: sessionIdRef.current, send, clearMessages, addWelcomeMessage };
}
