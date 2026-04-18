import React, { useEffect, useRef, useState, useCallback } from 'react';
import { initializeClient } from '../api/client';
import { generateSpeech } from '../api/avatar';
import { useChat } from '../hooks/useChat';
import { useFileUpload } from '../hooks/useFileUpload';
import { AvatarScene } from './AvatarScene';
import { AvatarModal } from './AvatarModal';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import type { LiyaAvatarWidgetProps, Viseme } from '../types';
import '../styles/variables.css';

function positionStyle(pos: string, offsetX: number, offsetY: number): React.CSSProperties {
  const base: React.CSSProperties = { position: 'fixed', zIndex: 9999 };
  if (pos.includes('bottom')) base.bottom = offsetY;
  else base.top = offsetY;
  if (pos.includes('right')) base.right = offsetX;
  else base.left = offsetX;
  return base;
}

export function LiyaAvatarWidget(props: LiyaAvatarWidgetProps) {
  const {
    apiKey, baseUrl, assistantId, position = 'bottom-right',
    offsetX = 24, offsetY = 24,
    welcomeMessage, placeholder, showBranding = true,
    showVoice, voiceEnabled, showFileUpload, showAvatarButton = true,
    avatarModelUrl, autoSpeak = true, locale,
    liyaWidgetMode = 'standard', closeButtonEnabled = true,
    onOpened, onClosed, onMessageSent, onMessageReceived,
    onAvatarOpened, onAvatarClosed,
  } = props;

  const [open, setOpen] = useState(props.viewOnPageStart ?? false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [visemes, setVisemes] = useState<Viseme[]>([]);
  const [audioRef] = useState(() => (typeof Audio !== 'undefined' ? new Audio() : null));

  const { messages, isLoading, send, addWelcomeMessage } = useChat(assistantId);
  const { addFiles, uploadAll, hasPendingFiles } = useFileUpload();

  useEffect(() => {
    initializeClient({ apiKey, baseUrl, assistantId });
    if (welcomeMessage) addWelcomeMessage(welcomeMessage);
  }, []);

  const speakText = useCallback(async (text: string) => {
    if (!autoSpeak || !assistantId) return;
    try {
      const speech = await generateSpeech(text, assistantId);
      if (audioRef) {
        audioRef.src = speech.audioUrl;
        setVisemes(speech.visemes);
        setIsSpeaking(true);
        audioRef.onended = () => setIsSpeaking(false);
        await audioRef.play();
      }
    } catch {
      // TTS optional — silent fail
    }
  }, [autoSpeak, assistantId, audioRef]);

  const handleSend = async (text: string) => {
    onMessageSent?.(text);
    let fileIds: string[] | undefined;
    if (hasPendingFiles) fileIds = await uploadAll();
    const res = await send(text, fileIds);
    if (res) {
      onMessageReceived?.(res.message);
      speakText(res.message);
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) onOpened?.(); else onClosed?.();
  };

  const openAvatar = () => { setAvatarOpen(true); onAvatarOpened?.(); };
  const closeAvatar = () => { setAvatarOpen(false); onAvatarClosed?.(); };

  const chatWindowStyle: React.CSSProperties = {
    width: 360,
    height: liyaWidgetMode === 'kiosk' ? '100vh' : 520,
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <>
      {avatarOpen && (
        <AvatarModal
          modelUrl={avatarModelUrl}
          isSpeaking={isSpeaking}
          visemes={visemes}
          onClose={closeAvatar}
        />
      )}

      <div className="liya-widget" style={positionStyle(position, offsetX, offsetY)}>
        {open && (
          <div className="liya-chat-window" style={chatWindowStyle}>
            <div className="liya-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {showAvatarButton && (
                  <button
                    className="liya-icon-btn"
                    style={{ color: '#fff' }}
                    onClick={openAvatar}
                    title="Open 3D Avatar"
                  >
                    🎭
                  </button>
                )}
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#fff' }}>
                  {props.assistantName ?? 'AI Assistant'}
                </h3>
              </div>
              {closeButtonEnabled && (
                <button className="liya-close-btn" onClick={toggle}>✕</button>
              )}
            </div>

            {showAvatarButton && (
              <div style={{ padding: '8px 16px', background: 'var(--liya-bg-secondary)' }}>
                <AvatarScene
                  modelUrl={avatarModelUrl}
                  width={328}
                  height={180}
                  isSpeaking={isSpeaking}
                  visemes={visemes}
                />
              </div>
            )}

            {props.welcomeSuggestions && props.welcomeSuggestions.length > 0 && messages.length <= 1 && (
              <div style={{ padding: '8px 16px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {props.welcomeSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    style={{
                      background: 'var(--liya-bg-secondary)',
                      border: '1px solid var(--liya-border)',
                      borderRadius: 20,
                      color: 'var(--liya-text-secondary)',
                      cursor: 'pointer',
                      fontSize: 12,
                      padding: '4px 12px',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <MessageList messages={messages} isLoading={isLoading} />
            {showBranding && <div className="liya-branding">Powered by Liya AI</div>}
            <ChatInput
              onSend={handleSend}
              disabled={isLoading}
              placeholder={placeholder}
              showFileUpload={showFileUpload}
              locale={locale}
              onAttach={addFiles}
            />
          </div>
        )}

        <button className="liya-fab" onClick={toggle} title="Open Assistant">
          {open ? '✕' : (props.customIcon ?? '🤖')}
        </button>
      </div>
    </>
  );
}
