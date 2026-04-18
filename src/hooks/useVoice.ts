import { useState, useRef, useCallback } from 'react';

type VoiceLocale = 'tr' | 'en';
const LANG_MAP: Record<VoiceLocale, string> = { tr: 'tr-TR', en: 'en-US' };

export function useVoice(locale: VoiceLocale = 'en') {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const start = useCallback((onResult: (text: string) => void) => {
    if (!isSupported) { setError('notSupported'); return; }
    const SR = (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition ?? SpeechRecognition;
    const rec = new SR();
    rec.lang = LANG_MAP[locale];
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => { onResult(e.results[0][0].transcript); };
    rec.onerror = (e) => { setError(e.error); setIsListening(false); };
    rec.onend = () => setIsListening(false);
    recRef.current = rec;
    rec.start();
    setIsListening(true);
    setError(null);
  }, [isSupported, locale]);

  const stop = useCallback(() => { recRef.current?.stop(); setIsListening(false); }, []);
  return { isListening, error, isSupported, start, stop };
}
