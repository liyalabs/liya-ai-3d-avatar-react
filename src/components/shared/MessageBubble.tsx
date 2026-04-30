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
import React, { useState, useMemo } from 'react'
import type { Message, ParsedResponse } from '../../types'
import { renderMarkdown } from '../../utils/markdown'
import './MessageBubble.css'

interface MediaItem {
  type: 'image' | 'video'
  url: string
  alt: string
}

export interface MessageBubbleProps {
  message: Message
  showAvatar?: boolean
  assistantName?: string
  onSuggestionClick?: (suggestion: string) => void
  onSuggestionEdit?: (suggestion: string) => void
  onMediaClick?: (media: MediaItem) => void
}

const excludedPreviewFields = ['metadata', 'source', 'sources', 'raw_response', 'id', 'created_at', 'updated_at', 'session_id', 'message_id', 'response', 'suggestions']

export default function MessageBubble({
  message,
  showAvatar = true,
  assistantName = 'Assistant',
  onSuggestionClick,
  onSuggestionEdit,
  onMediaClick
}: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [mediaLoadStates, setMediaLoadStates] = useState<Record<string, string>>({})
  const [copySuccess, setCopySuccess] = useState(false)

  const mediaImages = useMemo(() => {
    if (message.media && Array.isArray(message.media)) {
      return message.media
        .filter((m: any) => m.type === 'image')
        .map((m: any) => ({ type: 'image' as const, url: m.url, alt: m.alt || 'Görsel' }))
    }
    const content = message.content || ''
    const regex = /!\[([^\]]*)\]\(([^)]+)\)/g
    const images: MediaItem[] = []
    let match
    while ((match = regex.exec(content)) !== null) {
      images.push({ type: 'image', url: match[2], alt: match[1] || 'Görsel' })
    }
    return images
  }, [message])

  const mediaVideos = useMemo(() => {
    if (message.media && Array.isArray(message.media)) {
      return message.media
        .filter((m: any) => m.type === 'video')
        .map((m: any) => ({ type: 'video' as const, url: m.url, alt: m.alt || 'Video' }))
    }
    const content = message.content || ''
    const regex = /\[([^\]]*)\]\((https?:\/\/[^)]+\.(?:mp4|webm|mov|MP4|WEBM|MOV))\)/g
    const videos: MediaItem[] = []
    let match
    while ((match = regex.exec(content)) !== null) {
      videos.push({ type: 'video', url: match[2], alt: match[1] || 'Video' })
    }
    return videos
  }, [message])

  const parsedResponse = useMemo<ParsedResponse | null>(() => {
    if (isUser) return null
    const content = message.raw_response || message.content
    if (!content) return null
    try {
      let jsonStr = content.trim()
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
      if (jsonMatch) jsonStr = jsonMatch[0]
      const parsed = JSON.parse(jsonStr)
      if (parsed && typeof parsed.response === 'string') return parsed as ParsedResponse
      return null
    } catch {
      return null
    }
  }, [isUser, message])

  const hasJsonContent = useMemo(() => {
    if (isUser || parsedResponse) return false
    const content = message.content
    if (!content || typeof content !== 'string') return false
    const trimmed = content.trim()
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed)
        return true
      } catch {
        return false
      }
    }
    return false
  }, [isUser, parsedResponse, message.content])

  const jsonData = useMemo(() => {
    if (!hasJsonContent || !message.content) return null
    try {
      return JSON.parse(message.content.trim())
    } catch {
      return null
    }
  }, [hasJsonContent, message.content])

  const displayContent = useMemo(() => {
    const raw = parsedResponse ? parsedResponse.response : message.content
    if (!isUser && raw) return renderMarkdown(raw)
    return raw || ''
  }, [parsedResponse, message.content, isUser])

  const suggestions = useMemo(() => {
    const rawSuggestions = parsedResponse?.suggestions || []
    const mapped = rawSuggestions.map((s: any) => typeof s === 'object' ? JSON.stringify(s) : String(s))
    return Array.from(new Set(mapped))
  }, [parsedResponse])

  const handleCopy = async () => {
    const text = parsedResponse ? parsedResponse.response : (message.content || '')
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isTableData = (value: unknown): boolean => Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null
  const getTableHeaders = (arr: any[]): string[] => arr.length ? Object.keys(arr[0]) : []
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'number') return Number.isInteger(value) ? value.toLocaleString('tr-TR') : value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır'
    return String(value)
  }
  const filterPreviewData = (data: Record<string, any>) => Object.fromEntries(Object.entries(data).filter(([k]) => !excludedPreviewFields.includes(k.toLowerCase())))
  const getItemText = (item: any) => typeof item === 'object' ? JSON.stringify(item) : String(item)

  return (
    <div className={`liya-ai-3d-avatar-react-message ${isUser ? 'liya-ai-3d-avatar-react-message--user' : 'liya-ai-3d-avatar-react-message--assistant'}`}>
      {showAvatar && !isUser && (
        <div className="liya-ai-3d-avatar-react-message__avatar">
          <div className="liya-ai-3d-avatar-react-avatar liya-ai-3d-avatar-react-avatar--assistant">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
        </div>
      )}

      <div className="liya-ai-3d-avatar-react-message__content">
        <div className="liya-ai-3d-avatar-react-message__bubble">
          {hasJsonContent && jsonData ? (
            <div className="liya-ai-3d-avatar-react-json-preview">
              {Array.isArray(jsonData) ? (
                isTableData(jsonData) ? (
                  <div className="liya-ai-3d-avatar-react-table-container">
                    <table className="liya-ai-3d-avatar-react-table">
                      <thead>
                        <tr>{getTableHeaders(jsonData).map(h => <th key={h}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {jsonData.map((row, idx) => (
                          <tr key={idx}>
                            {getTableHeaders(jsonData).map(h => <td key={h}>{formatCellValue(row[h])}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="liya-ai-3d-avatar-react-suggestions-grid">
                    {jsonData.map((item, idx) => (
                      <div key={idx} className="liya-ai-3d-avatar-react-suggestion-item">
                        <button className="liya-ai-3d-avatar-react-suggestion-btn" onClick={() => onSuggestionClick?.(getItemText(item))}>
                          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"/></svg>
                          <span>{getItemText(item)}</span>
                        </button>
                        <button className="liya-ai-3d-avatar-react-edit-btn" onClick={() => onSuggestionEdit?.(getItemText(item))}>
                          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : typeof jsonData === 'object' && jsonData !== null ? (
                <div className="liya-ai-3d-avatar-react-cards-container">
                  {Object.entries(filterPreviewData(jsonData)).map(([key, value], i) => (
                    isTableData(value) ? (
                      <div key={i} className="liya-ai-3d-avatar-react-card">
                        <div className="liya-ai-3d-avatar-react-card__header"><span>{key}</span></div>
                        <div className="liya-ai-3d-avatar-react-table-container">
                          <table className="liya-ai-3d-avatar-react-table">
                            <thead><tr>{getTableHeaders(value as any[]).map(h => <th key={h}>{h}</th>)}</tr></thead>
                            <tbody>
                              {(value as any[]).map((row, idx) => (
                                <tr key={idx}>{getTableHeaders(value as any[]).map(h => <td key={h}>{formatCellValue(row[h])}</td>)}</tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : Array.isArray(value) ? (
                      <div key={i} className="liya-ai-3d-avatar-react-card">
                        <div className="liya-ai-3d-avatar-react-suggestions-grid">
                          {value.map((item, idx) => (
                            <div key={idx} className="liya-ai-3d-avatar-react-suggestion-item">
                              <button className="liya-ai-3d-avatar-react-suggestion-btn" onClick={() => onSuggestionClick?.(getItemText(item))}>
                                <span>{getItemText(item)}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : typeof value === 'object' && value !== null ? (
                      <div key={i} className="liya-ai-3d-avatar-react-card">
                        <div className="liya-ai-3d-avatar-react-card__header">{key}</div>
                        <div className="liya-ai-3d-avatar-react-card__grid">
                          {Object.entries(value).map(([sk, sv]) => (
                            <div key={sk} className="liya-ai-3d-avatar-react-card__item">
                              <div className="liya-ai-3d-avatar-react-card__label">{sk}</div>
                              <div className="liya-ai-3d-avatar-react-card__value">{formatCellValue(sv)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="liya-ai-3d-avatar-react-card liya-ai-3d-avatar-react-card--simple">
                        <div className="liya-ai-3d-avatar-react-card__text">{formatCellValue(value)}</div>
                      </div>
                    )
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="liya-ai-3d-avatar-react-message__text" dangerouslySetInnerHTML={{ __html: displayContent }} />
          )}

          {mediaImages.map(img => (
            <div key={img.url} className="liya-ai-3d-avatar-react-media-thumbnail" onClick={() => onMediaClick?.(img)}>
              {(!mediaLoadStates[img.url] || mediaLoadStates[img.url] === 'loading') && <div className="liya-ai-3d-avatar-react-media-skeleton" />}
              <img src={img.url} alt={img.alt} crossOrigin="anonymous" className={`liya-ai-3d-avatar-react-media-img ${mediaLoadStates[img.url] !== 'loaded' ? 'liya-ai-3d-avatar-react-media-img--hidden' : ''}`} loading="lazy" onLoad={() => setMediaLoadStates(p => ({...p, [img.url]: 'loaded'}))} onError={() => setMediaLoadStates(p => ({...p, [img.url]: 'error'}))} />
            </div>
          ))}

          {mediaVideos.map(vid => (
            <div key={vid.url} className="liya-ai-3d-avatar-react-media-thumbnail" onClick={() => onMediaClick?.(vid)}>
              <div className="liya-ai-3d-avatar-react-video-container">
                <video src={`${vid.url}#t=0.001`} preload="metadata" muted playsInline className="liya-ai-3d-avatar-react-video-thumb" onLoadedData={() => setMediaLoadStates(p => ({...p, [vid.url]: 'loaded'}))} onError={() => setMediaLoadStates(p => ({...p, [vid.url]: 'error'}))} />
                <div className="liya-ai-3d-avatar-react-video-overlay"><div className="liya-ai-3d-avatar-react-video-play-btn">▶</div></div>
              </div>
            </div>
          ))}
        </div>

        {!isUser && (displayContent || hasJsonContent) && (
          <button className={`liya-ai-3d-avatar-react-message__copy ${copySuccess ? 'liya-ai-3d-avatar-react-message__copy--success' : ''}`} onClick={handleCopy} title={copySuccess ? 'Kopyalandı!' : 'Kopyala'}>
            {copySuccess ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            )}
          </button>
        )}

        {suggestions.length > 0 && (
          <div className="liya-ai-3d-avatar-react-message__suggestions">
            {suggestions.map((s, i) => (
              <button key={i} className="liya-ai-3d-avatar-react-suggestion" onClick={() => onSuggestionClick?.(s as string)}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"/></svg>
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="liya-ai-3d-avatar-react-message__meta">
          <span className="liya-ai-3d-avatar-react-message__time">{formatTime(message.created_at)}</span>
          {message.response_time && <span className="liya-ai-3d-avatar-react-message__response-time">{message.response_time.toFixed(1)}s</span>}
        </div>
      </div>

      {showAvatar && isUser && (
        <div className="liya-ai-3d-avatar-react-message__avatar">
          <div className="liya-ai-3d-avatar-react-avatar liya-ai-3d-avatar-react-avatar--user">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
        </div>
      )}
    </div>
  )
}
