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
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import type { Message } from '../../types'
import MessageBubble from './MessageBubble'
import './MessageList.css'

export interface MessageListProps {
  messages: readonly Message[]
  isLoading?: boolean
  assistantName?: string
  welcomeMessage?: string
  welcomeSuggestions?: string[]
  preparingText?: string
  onSuggestionClick?: (suggestion: string) => void
}

export interface MessageListHandle {
  scrollToBottom: () => void
}

const MessageList = forwardRef<MessageListHandle, MessageListProps>(({
  messages,
  isLoading = false,
  assistantName = 'Assistant',
  welcomeMessage = '',
  welcomeSuggestions = [],
  preparingText = '',
  onSuggestionClick
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }

  useImperativeHandle(ref, () => ({
    scrollToBottom
  }))

  useEffect(() => {
    scrollToBottom()
  }, [messages.length, isLoading])

  const handleSuggestionClick = (suggestion: string) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion)
    }
  }

  return (
    <div ref={containerRef} className="liya-ai-3d-avatar-react-message-list">
      {/* Welcome message */}
      {messages.length === 0 && welcomeMessage && (
        <div className="liya-ai-3d-avatar-react-welcome">
          <div className="liya-ai-3d-avatar-react-welcome__icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
          </div>
          <p className="liya-ai-3d-avatar-react-welcome__text">{welcomeMessage}</p>
          {welcomeSuggestions.length > 0 && (
            <div className="liya-ai-3d-avatar-react-welcome__suggestions">
              {welcomeSuggestions.map(suggestion => (
                <button
                  key={suggestion}
                  className="liya-ai-3d-avatar-react-welcome__suggestion-btn"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      {messages.map(message => (
        <MessageBubble
          key={message.id}
          message={message}
          assistantName={assistantName}
          onSuggestionClick={handleSuggestionClick}
        />
      ))}

      {/* Welcome suggestions (shown when only a welcome message exists) */}
      {messages.length === 1 && messages[0].id?.startsWith('welcome-') && welcomeSuggestions.length > 0 && (
        <div className="liya-ai-3d-avatar-react-welcome__suggestions liya-ai-3d-avatar-react-welcome__suggestions--inline">
          {welcomeSuggestions.map(suggestion => (
            <button
              key={suggestion}
              className="liya-ai-3d-avatar-react-welcome__suggestion-btn"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Typing indicator */}
      {isLoading && (
        <div className="liya-ai-3d-avatar-react-typing">
          <div className="liya-ai-3d-avatar-react-typing__avatar">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <div className="liya-ai-3d-avatar-react-typing__content">
            <div className="liya-ai-3d-avatar-react-typing__dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            {preparingText && <p className="liya-ai-3d-avatar-react-typing__text">{preparingText}</p>}
          </div>
        </div>
      )}
    </div>
  )
})

export default MessageList
