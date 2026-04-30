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
// Liya AI Chat - useVoice Hook (React Version)
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { logger } from "../utils/logger";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Global state to avoid multiple instances issues
let recognition: SpeechRecognition | null = null;

export function useVoice(locale = "tr-TR") {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [micPermission, setMicPermission] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");

  const SpeechRecognitionAPI = useMemo(
    () =>
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null,
    [],
  );

  const isIOS = useMemo(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined")
      return false;
    const userAgent = navigator.userAgent || navigator.vendor || "";
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isIPadOS =
      navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return isIOSDevice || isIPadOS;
  }, []);

  const isSupported = useMemo(() => {
    if (!SpeechRecognitionAPI) return false;
    const userAgent =
      typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isOpera =
      userAgent.indexOf("OPR/") !== -1 || userAgent.indexOf("Opera") !== -1;
    return !isOpera;
  }, [SpeechRecognitionAPI]);

  const checkMicPermission = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.permissions)
      return "prompt";
    try {
      const result = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      setMicPermission(result.state as any);
      result.onchange = () => setMicPermission(result.state as any);
      return result.state as any;
    } catch {
      return "prompt";
    }
  }, []);

  const requestMicPermission = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices)
      return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicPermission("granted");
      return true;
    } catch {
      setMicPermission("denied");
      return false;
    }
  }, []);

  const initRecognition = useCallback(() => {
    if (!SpeechRecognitionAPI || recognition) return;

    recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = locale;

    recognition.onstart = () => {
      logger.log("[useVoice] 🎙️ Recognition started");
      setIsRecording(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) final += result[0].transcript;
        else interim += result[0].transcript;
      }
      logger.log("[useVoice] 📝 Result received", { final, interim });
      if (final) setTranscript((prev) => prev + (prev ? " " : "") + final);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      logger.error("[useVoice] ❌ Recognition error", {
        error: event.error,
        message: event.message,
      });
      setError(getErrorMessage(event.error));
      setIsRecording(false);
    };

    recognition.onend = () => {
      logger.log("[useVoice] 🏁 Recognition ended");
      setIsRecording(false);
      setInterimTranscript("");
    };
  }, [SpeechRecognitionAPI, locale]);

  const startRecording = useCallback(() => {
    if (!isSupported) {
      setError(locale.startsWith("tr") ? "Desteklenmiyor" : "Not supported");
      return;
    }
    initRecognition();
    if (recognition && !isRecording) {
      setTranscript("");
      setInterimTranscript("");
      setError(null);
      try {
        recognition.start();
      } catch {
        setError("Failed to start");
      }
    }
  }, [isSupported, locale, initRecognition, isRecording]);

  const stopRecording = useCallback((): string => {
    logger.log("[useVoice] 🛑 stopRecording called", {
      isRecording,
      transcript,
      interimTranscript,
    });
    if (recognition && isRecording) recognition.stop();
    const finalResult = (transcript + " " + interimTranscript).trim();
    return finalResult;
  }, [isRecording, transcript, interimTranscript]);

  const cancelRecording = useCallback(() => {
    if (recognition && isRecording) recognition.abort();
    setTranscript("");
    setInterimTranscript("");
  }, [isRecording]);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  function getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      "no-speech": "No speech detected.",
      "audio-capture": "Microphone not available.",
      "not-allowed": "Permission denied.",
      network: "Network error.",
      aborted: "Cancelled.",
    };
    return errorMessages[errorCode] || "Error occurred.";
  }

  useEffect(() => {
    return () => {
      if (recognition && isRecording) recognition.abort();
      recognition = null;
    };
  }, [isRecording]);

  return {
    isRecording,
    transcript,
    interimTranscript,
    error,
    isSupported,
    isIOS,
    micPermission,
    fullTranscript: (transcript + " " + interimTranscript).trim(),
    startRecording,
    stopRecording,
    cancelRecording,
    clearTranscript,
    checkMicPermission,
    requestMicPermission,
  };
}
