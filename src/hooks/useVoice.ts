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

const MIC_PERMISSION_KEY = "liya_mic_permission";

function readMicPermissionCache(): "prompt" | "granted" | "denied" {
  if (typeof localStorage === "undefined") return "prompt";
  const val = localStorage.getItem(MIC_PERMISSION_KEY);
  if (val === "granted" || val === "denied") return val;
  return "prompt";
}

function writeMicPermissionCache(val: "prompt" | "granted" | "denied") {
  if (typeof localStorage === "undefined") return;
  if (val === "prompt") {
    localStorage.removeItem(MIC_PERMISSION_KEY);
  } else {
    localStorage.setItem(MIC_PERMISSION_KEY, val);
  }
}

export function useVoice(locale = "tr-TR") {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [micPermission, setMicPermission] = useState<
    "prompt" | "granted" | "denied"
  >(readMicPermissionCache);

  // Ref mirror'ları: recognition handler'ları (onend, onerror) stale closure'dan
  // etkilenmesin diye en güncel state'e her zaman ref üzerinden eriş.
  const isRecordingRef = useRef(false);
  const transcriptRef = useRef("");
  const interimTranscriptRef = useRef("");

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

  // Ref'leri state ile senkron tut
  // (her render'da çalışır, useEffect gerektirmez)
  isRecordingRef.current = isRecording;
  transcriptRef.current = transcript;
  interimTranscriptRef.current = interimTranscript;

  // localStorage'a da yazan setter
  const setMicPermissionPersist = useCallback(
    (val: "prompt" | "granted" | "denied") => {
      writeMicPermissionCache(val);
      setMicPermission(val);
    },
    [],
  );

  const checkMicPermission = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.permissions)
      return "prompt";
    try {
      const result = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      setMicPermissionPersist(result.state as any);
      result.onchange = () => setMicPermissionPersist(result.state as any);
      return result.state as any;
    } catch {
      return "prompt";
    }
  }, [setMicPermissionPersist]);

  const requestMicPermission = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices)
      return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicPermissionPersist("granted");
      return true;
    } catch {
      setMicPermissionPersist("denied");
      return false;
    }
  }, [setMicPermissionPersist]);

  // Mount'ta Permissions API ile localStorage'ı doğrula / güncelle
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) return;
    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((result) => {
        setMicPermissionPersist(result.state as any);
        result.onchange = () => setMicPermissionPersist(result.state as any);
      })
      .catch(() => {
        /* Permissions API desteklenmiyorsa cache'den okunan değer kalır */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initRecognition = useCallback(() => {
    if (!SpeechRecognitionAPI || recognition) return;

    recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = locale;

    recognition.onstart = () => {
      logger.log("[useVoice] 🎙️ Recognition started");
      isRecordingRef.current = true;
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
      if (final) {
        setTranscript((prev) => {
          const next = prev + (prev ? " " : "") + final;
          transcriptRef.current = next;
          return next;
        });
      }
      interimTranscriptRef.current = interim;
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      logger.error("[useVoice] ❌ Recognition error", {
        error: event.error,
        message: event.message,
      });
      setError(getErrorMessage(event.error));
      isRecordingRef.current = false;
      setIsRecording(false);
    };

    recognition.onend = () => {
      logger.log("[useVoice] 🏁 Recognition ended");
      isRecordingRef.current = false;
      setIsRecording(false);
      interimTranscriptRef.current = "";
      setInterimTranscript("");
    };
  }, [SpeechRecognitionAPI, locale]);

  const startRecording = useCallback(() => {
    if (!isSupported) {
      setError(locale.startsWith("tr") ? "Desteklenmiyor" : "Not supported");
      return;
    }
    initRecognition();
    // Ref'den oku — stale closure tehlikesi yok
    if (recognition && !isRecordingRef.current) {
      transcriptRef.current = "";
      interimTranscriptRef.current = "";
      setTranscript("");
      setInterimTranscript("");
      setError(null);
      try {
        recognition.start();
      } catch {
        setError("Failed to start");
      }
    }
  }, [isSupported, locale, initRecognition]);

  const stopRecording = useCallback((): string => {
    // Ref'lerden oku — stale closure tehlikesi yok, her zaman güncel değer
    const currentTranscript = transcriptRef.current;
    const currentInterim = interimTranscriptRef.current;
    logger.log("[useVoice] 🛑 stopRecording called", {
      isRecording: isRecordingRef.current,
      transcript: currentTranscript,
      interimTranscript: currentInterim,
    });
    if (recognition && isRecordingRef.current) recognition.stop();
    const finalResult = (currentTranscript + " " + currentInterim).trim();
    return finalResult;
  }, []);

  const cancelRecording = useCallback(() => {
    if (recognition && isRecordingRef.current) recognition.abort();
    transcriptRef.current = "";
    interimTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
  }, []);

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
      if (recognition && isRecordingRef.current) recognition.abort();
      recognition = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
