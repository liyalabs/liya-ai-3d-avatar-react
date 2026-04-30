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
import { useState, useCallback } from 'react'
import type { Session } from '../types'
import {
  getSessions as apiGetSessions,
  createSession as apiCreateSession,
  deleteSession as apiDeleteSession,
} from '../api'

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalSessions, setTotalSessions] = useState(0)

  const loadSessions = useCallback(async (limit = 20, offset = 0) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiGetSessions(limit, offset)
      setSessions(response.sessions)
      setTotalSessions(response.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createSession = useCallback(async (sessionName?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const session = await apiCreateSession(sessionName)
      setSessions(prev => [session, ...prev])
      setCurrentSession(session)
      return session
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteSession = useCallback(async (sessionId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await apiDeleteSession(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      setCurrentSession(prev => prev?.id === sessionId ? null : prev)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const selectSession = useCallback((session: Session | null) => {
    setCurrentSession(session)
  }, [])

  const clearSessions = useCallback(() => {
    setSessions([])
    setCurrentSession(null)
    setTotalSessions(0)
  }, [])

  return {
    sessions,
    currentSession,
    isLoading,
    error,
    totalSessions,
    loadSessions,
    createSession,
    deleteSession,
    selectSession,
    clearSessions
  }
}
