export interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  borderRadius?: string;
  position?: WidgetPosition;
  widgetSize?: 'small' | 'medium' | 'large';
  zIndex?: number;
}

export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type WidgetMode = 'standard' | 'modal_kiosk' | 'kiosk';

export interface LiyaChatConfig {
  apiKey: string;
  baseUrl?: string;
  assistantId?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  isTemp?: boolean;
}

export interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface PendingFile {
  file: File;
}

export interface ChatResponse {
  sessionId: string;
  message: string;
  annotations?: unknown[];
}

export interface Viseme {
  time: number;
  viseme: number;
  duration: number;
}

export interface SpeechResponse {
  audioUrl: string;
  visemes: Viseme[];
  duration: number;
}

export interface AvatarColors {
  top?: string;
  bottom?: string;
  footwear?: string;
}

export interface LiyaAvatarWidgetProps {
  apiKey: string;
  baseUrl?: string;
  assistantId?: string;
  position?: WidgetPosition;
  theme?: ThemeConfig;
  assistantName?: string;
  welcomeMessage?: string;
  welcomeSuggestions?: string[];
  placeholder?: string;
  showBranding?: boolean;
  showVoice?: boolean;
  voiceEnabled?: boolean;
  showFileUpload?: boolean;
  showAvatarButton?: boolean;
  avatarModelUrl?: string;
  offsetX?: number;
  offsetY?: number;
  customIcon?: string;
  autoSpeak?: boolean;
  animateButton?: boolean;
  viewOnPageStart?: boolean;
  liyaWidgetMode?: WidgetMode;
  closeButtonEnabled?: boolean;
  locale?: 'tr' | 'en';
  onOpened?: () => void;
  onClosed?: () => void;
  onMessageSent?: (message: string) => void;
  onMessageReceived?: (message: string) => void;
  onSearchResults?: (data: { annotations: unknown[]; response: string; sessionId: string }) => void;
  onAvatarOpened?: () => void;
  onAvatarClosed?: () => void;
}
