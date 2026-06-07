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
// Liya AI Chat - TypeScript Type Definitions (React Version)

// ============================================================================
// Configuration Types
// ============================================================================

export type ChatMode = "widget" | "app";

export type LiyaWidgetMode = "standard" | "modal_kiosk" | "kiosk";

export interface LiyaChatConfig {
  mode: ChatMode;
  apiKey: string;
  baseUrl: string;
  apiUrl?: string;
  assistantId: string;
  assistantName?: string;
  avatarModelUrl?: string;
  theme?: ThemeConfig;
  features?: FeaturesConfig;
  locale?: string;
}

export interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  borderRadius?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  widgetSize?: "small" | "medium" | "large";
  zIndex?: number;
}

export interface FeaturesConfig {
  voice?: boolean;
  voiceEnabled?: boolean;
  fileUpload?: boolean;
  sessionHistory?: boolean;
  markdown?: boolean;
  codeHighlight?: boolean;
  typingIndicator?: boolean;
  soundEffects?: boolean;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  status: "success" | "error";
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// ============================================================================
// Assistant Types
// ============================================================================

export interface Assistant {
  id: string;
  name: string;
  description: string;
  model: string;
  total_messages: number;
}

// ============================================================================
// Session Types
// ============================================================================

export interface Session {
  id: string;
  assistant_id?: string;
  session_name: string;
  message_count: number;
  created_at: string;
  last_message_at: string | null;
}

export interface SessionListResponse {
  sessions: Session[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateSessionRequest {
  assistant_id: string;
  session_name?: string;
  external_session_id?: string;
}

// ============================================================================
// Message Types
// ============================================================================

export type MessageRole = "user" | "assistant";

export interface MessageMediaItem {
  type: "image" | "video";
  url: string;
  alt?: string;
  source?: string;
}

export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  created_at: string;
  response_time?: number;
  attachments?: readonly FileAttachment[];
  raw_response?: string;
  media?: readonly MessageMediaItem[];
}

export interface ParsedResponse {
  response: string;
  suggestions?: string[];
  source?: string;
  metadata?: {
    confidence?: number;
    category?: string;
    requires_followup?: boolean;
  };
}

export interface SendMessageRequest {
  assistant_id: string;
  message: string;
  session_id?: string;
  external_session_id?: string;
  file_ids?: string[];
  response_language?: string;  // 'tr' | 'en' | 'zh' — AI response language override
}

export interface UrlCitationAnnotation {
  type: "url_citation";
  url: string;
  title: string;
  start_index: number;
  end_index: number;
}

export interface FileCitationAnnotation {
  type: "file_citation";
  file_id: string;
  index: number;
}

export type Annotation = UrlCitationAnnotation | FileCitationAnnotation;

export interface SendMessageResponse {
  session_id: string;
  message_id?: string;
  response?: string;
  response_time?: number;
  user_message?: Message;
  assistant_message?: Message;
  suggestions?: string[];
  metadata?: Record<string, any>;
  presentation_result?: Record<string, any>;
  annotations?: Annotation[];
  media?: MessageMediaItem[];
}

export interface SessionHistoryResponse {
  session_id: string;
  messages: Message[];
  total: number;
}

// ============================================================================
// File Types
// ============================================================================

export interface FileAttachment {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  openai_file_id?: string;
  created_at: string;
}

export interface UploadFileRequest {
  session_id: string;
  file: File;
}

// ============================================================================
// Avatar & Voice Types
// ============================================================================

export interface Viseme {
  time: number;
  viseme: number;
  duration: number;
}

export interface SpeechResponse {
  audioUrl: string;
  visemes: Viseme[];
}
