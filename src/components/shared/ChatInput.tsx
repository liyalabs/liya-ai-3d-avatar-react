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
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useVoice } from "../../hooks/useVoice";
import { useI18n } from "../../hooks/useI18n";
import "./ChatInput.css";

export interface ChatInputProps {
  placeholder?: string;
  disabled?: boolean;
  showVoice?: boolean;
  voiceEnabled?: boolean;
  showFileUpload?: boolean;
  maxLength?: number;
  sessionId?: string | null;
  onSend: (message: string, fileIds?: string[]) => void;
}

export default function ChatInput({
  placeholder = "",
  disabled = false,
  showVoice = true,
  voiceEnabled = true,
  showFileUpload = false,
  maxLength = 4000,
  sessionId = null,
  onSend,
}: ChatInputProps) {
  const { t } = useI18n();
  const placeholderText = placeholder || t.chat.placeholder;

  const [inputText, setInputText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isRecording,
    fullTranscript,
    isSupported: voiceSupported,
    startRecording,
    stopRecording,
  } = useVoice();

  const canSend = useMemo(() => {
    return inputText.trim().length > 0 && !disabled;
  }, [inputText, disabled]);

  const characterCount = inputText.length;

  useEffect(() => {
    if (fullTranscript) {
      setInputText(fullTranscript);
    }
  }, [fullTranscript]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    adjustTextareaHeight();
  };

  const handleSend = () => {
    if (!canSend) return;
    const message = inputText.trim();
    onSend(message);
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeydown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleVoiceClick = () => {
    if (isRecording) {
      const transcript = stopRecording();
      if (transcript) {
        setInputText(transcript);
      }
    } else {
      startRecording();
    }
  };

  return (
    <div className="liya-ai-3d-avatar-react-chat-input">
      <div className="liya-ai-3d-avatar-react-chat-input__wrapper">
        <textarea
          ref={textareaRef}
          value={inputText}
          placeholder={placeholderText}
          disabled={disabled}
          maxLength={maxLength}
          className="liya-ai-3d-avatar-react-chat-input__textarea"
          rows={1}
          onChange={handleInput}
          onKeyDown={handleKeydown}
        />

        {showVoice && voiceSupported && (
          <button
            type="button"
            className={`liya-ai-3d-avatar-react-chat-input__btn liya-ai-3d-avatar-react-chat-input__btn--voice ${
              isRecording
                ? "liya-ai-3d-avatar-react-chat-input__btn--recording"
                : ""
            } ${!voiceEnabled ? "liya-ai-3d-avatar-react-chat-input__btn--voice-disabled" : ""}`}
            disabled={disabled || !voiceEnabled}
            onClick={voiceEnabled ? handleVoiceClick : undefined}
            title={
              !voiceEnabled
                ? t.voice.voiceNotSupported
                : isRecording
                  ? t.voice.stopRecording
                  : t.voice.startRecording
            }
          >
            {!voiceEnabled ? (
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="20"
                height="20"
              >
                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
              </svg>
            ) : !isRecording ? (
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="20"
                height="20"
              >
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="20"
                height="20"
              >
                <path d="M6 6h12v12H6z" />
              </svg>
            )}
          </button>
        )}

        <button
          type="button"
          className="liya-ai-3d-avatar-react-chat-input__btn liya-ai-3d-avatar-react-chat-input__btn--send"
          disabled={!canSend}
          onClick={handleSend}
          title={t.chat.send}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>

      {characterCount > maxLength * 0.8 && (
        <div className="liya-ai-3d-avatar-react-chat-input__count">
          {characterCount} / {maxLength}
        </div>
      )}
    </div>
  );
}
