export { LiyaAvatarWidget } from './components/LiyaAvatarWidget';
export { AvatarScene } from './components/AvatarScene';
export { initializeClient } from './api/client';
export { generateSpeech, fetchAvatarModel } from './api/avatar';
export { useChat } from './hooks/useChat';
export { useVoice } from './hooks/useVoice';
export { useFileUpload } from './hooks/useFileUpload';
export { useAvatarColors } from './hooks/useAvatarColors';
export { useI18n } from './i18n/useI18n';
export type {
  LiyaAvatarWidgetProps,
  ThemeConfig,
  LiyaChatConfig,
  Message,
  Viseme,
  SpeechResponse,
  AvatarColors,
  WidgetMode,
  WidgetPosition,
} from './types';
