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
import React from 'react'
import type { Session } from '../../types'
import './SessionSidebar.css'

export interface SessionSidebarProps {
  sessions: readonly Session[]
  currentSessionId?: string | null
  isLoading?: boolean
  assistantName?: string
  onSelectSession: (session: Session) => void
  onCreateSession: () => void
  onDeleteSession: (sessionId: string) => void
}

export default function SessionSidebar({
  sessions,
  currentSessionId = null,
  isLoading = false,
  assistantName = 'Assistant',
  onSelectSession,
  onCreateSession,
  onDeleteSession
}: SessionSidebarProps) {
  
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Dün'
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
    }
  }

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className="liya-ai-3d-avatar-react-sidebar">
      {/* Header */}
      <div className="liya-ai-3d-avatar-react-sidebar__header">
        <div className="liya-ai-3d-avatar-react-sidebar__logo">
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
          <span>{assistantName}</span>
        </div>
        <button 
          className="liya-ai-3d-avatar-react-sidebar__new-btn"
          onClick={onCreateSession}
          title="Yeni sohbet"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
      </div>

      {/* Session List */}
      <div className="liya-ai-3d-avatar-react-sidebar__list">
        {isLoading ? (
          <div className="liya-ai-3d-avatar-react-sidebar__loading">
            <div className="liya-ai-3d-avatar-react-sidebar__spinner"></div>
            <span>Yükleniyor...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="liya-ai-3d-avatar-react-sidebar__empty">
            <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
            <p>Henüz sohbet yok</p>
            <button className="liya-ai-3d-avatar-react-sidebar__start-btn" onClick={onCreateSession}>
              Yeni Sohbet Başlat
            </button>
          </div>
        ) : (
          sessions.map(session => (
            <div
              key={session.id}
              className={`liya-ai-3d-avatar-react-sidebar__item ${session.id === currentSessionId ? 'liya-ai-3d-avatar-react-sidebar__item--active' : ''}`}
              onClick={() => onSelectSession(session)}
            >
              <div className="liya-ai-3d-avatar-react-sidebar__item-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                </svg>
              </div>
              <div className="liya-ai-3d-avatar-react-sidebar__item-content">
                <div className="liya-ai-3d-avatar-react-sidebar__item-title">
                  {truncateText(session.session_name, 28)}
                </div>
                <div className="liya-ai-3d-avatar-react-sidebar__item-meta">
                  <span>{session.message_count} mesaj</span>
                  <span>{formatDate(session.last_message_at || session.created_at)}</span>
                </div>
              </div>
              <button 
                className="liya-ai-3d-avatar-react-sidebar__item-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteSession(session.id)
                }}
                title="Sohbeti sil"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
