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
import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import AvatarScene from "./AvatarScene";
import { useChat } from "../../hooks/useChat";
import { useVoice } from "../../hooks/useVoice";
import { getConfig } from "../../api";
import { useI18n } from "../../hooks/useI18n";
import { stripForTTS } from "../../utils/tts";
import "./AvatarModal.css";

export interface AvatarModalProps {
  isOpen: boolean;
  modelUrl?: string;
  assistantName?: string;
  welcomeMessage?: string;
  onClose: () => void;
  onMessageSent?: (message: string) => void;
  onMessageReceived?: (message: string) => void;
}

export default function AvatarModal({
  isOpen,
  modelUrl = "",
  assistantName = "AI Assistant",
  welcomeMessage = "",
  onClose,
  onMessageSent,
  onMessageReceived,
}: AvatarModalProps) {
  const config = getConfig();
  const { t, locale } = useI18n();
  const { messages, sendMessage } = useChat();
  const {
    isRecording: isListening,
    isSupported: isVoiceSupported,
    transcript,
    startRecording: startListening,
    stopRecording: stopListening,
  } = useVoice();

  // Avatar state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentVisemes, setCurrentVisemes] = useState<
    Array<{ time: number; viseme: number; duration: number }>
  >([]);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [preparingMessageIndex, setPreparingMessageIndex] = useState(0);

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Rotating preparing messages
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isProcessing) {
      setPreparingMessageIndex(0);
      const startTime = Date.now();
      timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed > 8000) {
          setPreparingMessageIndex(
            (prev) => (prev + 1) % t.preparingMessages.length,
          );
        }
      }, 4000);
    } else {
      setPreparingMessageIndex(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isProcessing, t.preparingMessages.length]);

  const hintText = useMemo(() => {
    if (isListening) return t.voice.listening;
    if (isProcessing) return t.preparingMessages[preparingMessageIndex];
    return t.voice.speakToMic;
  }, [
    isListening,
    isProcessing,
    preparingMessageIndex,
    t.voice.listening,
    t.preparingMessages,
    t.voice.speakToMic,
  ]);

  const assistantDisplayName =
    assistantName || config.assistantName || "AI Assistant";

  // Audio Context helper
  const ensureAudioContext = async (): Promise<AudioContext> => {
    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  // Handle message sending
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isProcessing) return;
    setIsProcessing(true);
    setCurrentMessage(message);
    onMessageSent?.(message);

    try {
      const response = await sendMessage(message, undefined, locale);
      if (response?.assistant_message?.content || response?.response) {
        const responseText =
          response.assistant_message?.content || response.response || "";
        onMessageReceived?.(responseText);

        let textToSpeak = responseText;
        try {
          const parsed = JSON.parse(responseText);
          if (parsed.response) textToSpeak = parsed.response;
        } catch {
          /* not JSON */
        }

        await speakWithAvatar(stripForTTS(textToSpeak));
      }
    } catch (error) {
      /* fail silent */
    } finally {
      setIsProcessing(false);
      setCurrentMessage("");
    }
  };

  // Lip-sync audio sync
  const playAudioWithSync = async (base64Audio: string) => {
    try {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const arrayBuffer = new ArrayBuffer(len);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < len; i++) uint8Array[i] = binaryString.charCodeAt(i);

      const ctx = await ensureAudioContext();
      const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
        ctx.decodeAudioData(arrayBuffer, resolve, (err) =>
          reject(err || new Error("Decode failed")),
        );
      });

      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
      }

      audioSourceRef.current = ctx.createBufferSource();
      audioSourceRef.current.buffer = audioBuffer;
      audioSourceRef.current.connect(ctx.destination);

      setIsSpeaking(true);
      startTimeRef.current = ctx.currentTime;

      const updateTime = () => {
        if (ctx) {
          setAudioCurrentTime(ctx.currentTime - startTimeRef.current);
          animationFrameRef.current = requestAnimationFrame(updateTime);
        }
      };
      updateTime();

      audioSourceRef.current.onended = () => {
        setIsSpeaking(false);
        setAudioCurrentTime(0);
        setCurrentVisemes([]);
        if (animationFrameRef.current)
          cancelAnimationFrame(animationFrameRef.current);
      };
      audioSourceRef.current.start();
    } catch (error) {
      setIsSpeaking(false);
    }
  };

  // Fallback simulation
  const simulateSpeaking = (text: string) => {
    const duration = text.length * 0.05;
    const visemes: Array<{ time: number; viseme: number; duration: number }> =
      [];
    let time = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text[i].toLowerCase();
      let viseme = 0;
      if ("aeiouäöü".includes(char))
        viseme = 10 + Math.floor(Math.random() * 5);
      else if ("bcdfghjklmnpqrstvwxyz".includes(char))
        viseme = 1 + Math.floor(Math.random() * 9);
      visemes.push({ time, viseme, duration: 0.05 });
      time += 0.05;
    }
    setCurrentVisemes(visemes);
    setIsSpeaking(true);
    setAudioCurrentTime(0);
    const startMs = Date.now();
    const anim = () => {
      const elapsed = (Date.now() - startMs) / 1000;
      setAudioCurrentTime(elapsed);
      if (elapsed < duration) requestAnimationFrame(anim);
      else {
        setIsSpeaking(false);
        setCurrentVisemes([]);
      }
    };
    anim();
  };

  const speakWithAvatar = async (text: string) => {
    try {
      const apiUrl = config.baseUrl || "";
      const apiKey = config.apiKey || "";
      const response = await fetch(`${apiUrl}/api/v1/external/avatar/speech/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
        body: JSON.stringify({
          text,
          voice: "nova",
          speed: 1.0,
          include_audio: true,
        }),
      });
      if (!response.ok) throw new Error("Speech API failed");
      const data = await response.json();
      if (data.status === "success" && data.data) {
        setCurrentVisemes(data.data.visemes || []);
        if (data.data.audio_base64)
          await playAudioWithSync(data.data.audio_base64);
      }
    } catch (e) {
      simulateSpeaking(text);
    }
  };

  // Voice transcript effect
  useEffect(() => {
    if (transcript && !isListening) {
      handleSendMessage(transcript);
    }
  }, [transcript, isListening]);

  const handleClose = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    setIsSpeaking(false);
    onClose();
  };

  // Keyboard events
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, []);

  // Cleanup audio
  useEffect(() => {
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  if (!isOpen && !isSpeaking) return null;

  return createPortal(
    <div
      className={`liya-ai-3d-avatar-react-avatar-modal-overlay ${isOpen ? "liya-ai-3d-avatar-react-avatar-modal-overlay--open" : ""}`}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="liya-ai-3d-avatar-react-avatar-modal">
        <div className="liya-ai-3d-avatar-react-avatar-modal__header">
          <div className="liya-ai-3d-avatar-react-avatar-modal__title">
            <div
              className={`liya-ai-3d-avatar-react-avatar-modal__status ${isSpeaking ? "liya-ai-3d-avatar-react-avatar-modal__status--speaking" : ""}`}
            />
            <span>{assistantDisplayName}</span>
          </div>
          <button
            className="liya-ai-3d-avatar-react-avatar-modal__close"
            onClick={handleClose}
            aria-label={t.kiosk.close}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="liya-ai-3d-avatar-react-avatar-modal__scene">
          <AvatarScene
            modelUrl={modelUrl}
            width={400}
            height={450}
            isSpeaking={isSpeaking}
            visemes={currentVisemes}
            currentTime={audioCurrentTime}
          />
        </div>

        <div className="liya-ai-3d-avatar-react-avatar-modal__message">
          {isProcessing ? (
            <div className="liya-ai-3d-avatar-react-avatar-modal__thinking">
              <span className="liya-ai-3d-avatar-react-avatar-modal__thinking-dot" />
              <span className="liya-ai-3d-avatar-react-avatar-modal__thinking-dot" />
              <span className="liya-ai-3d-avatar-react-avatar-modal__thinking-dot" />
            </div>
          ) : currentMessage ? (
            <p>{currentMessage}</p>
          ) : messages.length === 0 ? (
            <p className="liya-ai-3d-avatar-react-avatar-modal__welcome">
              {welcomeMessage}
            </p>
          ) : (
            <p>{messages[messages.length - 1]?.content}</p>
          )}
        </div>

        <div className="liya-ai-3d-avatar-react-avatar-modal__controls">
          {isVoiceSupported && (
            <button
              className={`liya-ai-3d-avatar-react-avatar-modal__mic ${isListening ? "liya-ai-3d-avatar-react-avatar-modal__mic--active" : ""} ${isProcessing || isSpeaking ? "liya-ai-3d-avatar-react-avatar-modal__mic--disabled" : ""}`}
              disabled={isProcessing || isSpeaking}
              onClick={() => (isListening ? stopListening() : startListening())}
              aria-label={
                isListening ? t.voice.stopRecording : t.voice.startRecording
              }
            >
              {!isListening ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="32"
                  height="32"
                >
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="32"
                  height="32"
                >
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              )}
            </button>
          )}
          <p className="liya-ai-3d-avatar-react-avatar-modal__hint">
            {hintText}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
