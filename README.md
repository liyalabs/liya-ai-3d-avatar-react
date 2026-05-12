# @liyalabs/liya-3d-avatar-widget-react

Liya AI 3D Talking Avatar Widget for React — AI Assistant with real-time lip-sync animation.

[![npm version](https://img.shields.io/npm/v/@liyalabs/liya-3d-avatar-widget-react.svg)](https://www.npmjs.com/package/@liyalabs/liya-3d-avatar-widget-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **[Live Demo →](https://ai.liyalabs.com)** &nbsp;|&nbsp; **[Website →](https://liyalabs.com)** &nbsp;|&nbsp; **[API Docs →](https://ai.liyalabs.com/developer)**

## Screenshots

### Widget & Avatar Modal

| Widget (Chat Panel)                               | Avatar Modal (Lip-sync)                       |
| ------------------------------------------------- | --------------------------------------------- |
| ![Widget Desktop](screenshots/widget-desktop.png) | ![Avatar Modal](screenshots/avatar-modal.png) |

### Mobile

| Mobile Widget                                   | Mobile Avatar                                   |
| ----------------------------------------------- | ----------------------------------------------- |
| ![Widget Mobile](screenshots/widget-mobile.png) | ![Avatar Mobile](screenshots/avatar-mobile.png) |

---

## Features

- 🎭 **3D Avatar** — Three.js powered 3D avatar with customizable models (GLB/GLTF)
- 👄 **Lip-Sync** — Real-time lip synchronization using viseme data
- 🎤 **Voice Input** — Speech-to-text for hands-free interaction
- 🔊 **Voice Output** — Text-to-speech with avatar animation
- 💬 **Full Chat** — Complete chat widget with session history
- 📎 **File Upload** — Attach files to conversations
- 🖼️ **Media Display** — Inline image and video rendering in chat messages
- 💡 **Suggestions** — Quick reply suggestions
- 🎨 **Customizable** — Theming, positioning, and branding options
- 🌐 **i18n** — Turkish and English support

---

## Installation

```bash
npm install @liyalabs/liya-3d-avatar-widget-react
# or
yarn add @liyalabs/liya-3d-avatar-widget-react
# or
pnpm add @liyalabs/liya-3d-avatar-widget-react
```

**Peer dependencies** (install separately):

```bash
npm install react react-dom
```

---

## Quick Start

### 1. Initialize the Client

Call once at app startup, before rendering any widget:

```tsx
import { initializeClient } from "@liyalabs/liya-3d-avatar-widget-react";

initializeClient({
  baseUrl: "https://app-X-ai.liyalabs.com", // Your assigned backend URL
  apiKey: "your-api-key",
  assistantId: "your-assistant-id",
});
```

### 2. Use the Widget

```tsx
import { LiyaAvatarWidget } from "@liyalabs/liya-3d-avatar-widget-react";
import "@liyalabs/liya-3d-avatar-widget-react/style.css";

function App() {
  return (
    <LiyaAvatarWidget
      showAvatarButton={true}
      avatarModelUrl="/models/avatar.glb"
      welcomeMessage="Merhaba! Size nasıl yardımcı olabilirim?"
    />
  );
}
```

---

## Components

### `LiyaAvatarWidget`

Main floating widget with chat panel and optional avatar button.

#### Props

| Prop                 | Type                                                            | Default          | Description                                                   |
| -------------------- | --------------------------------------------------------------- | ---------------- | ------------------------------------------------------------- |
| `position`           | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | `'bottom-right'` | Widget position on screen                                     |
| `theme`              | `ThemeConfig`                                                   | `{}`             | Theme customization                                           |
| `assistantName`      | `string`                                                        | `''`             | Name of the AI assistant                                      |
| `welcomeMessage`     | `string`                                                        | `''`             | Welcome message shown on load                                 |
| `welcomeSuggestions` | `string[]`                                                      | `[]`             | Quick reply suggestions                                       |
| `placeholder`        | `string`                                                        | `''`             | Chat input placeholder text                                   |
| `showBranding`       | `boolean`                                                       | `true`           | Show Liya branding                                            |
| `showVoice`          | `boolean`                                                       | `true`           | Show voice input button                                       |
| `voiceEnabled`       | `boolean`                                                       | `true`           | Enable voice (false = disabled mic for STANDARD accounts)     |
| `showAvatarButton`   | `boolean`                                                       | `true`           | Show "Talk with Avatar" button                                |
| `avatarModelUrl`     | `string`                                                        | `''`             | URL to GLB/GLTF avatar model                                  |
| `offsetX`            | `number`                                                        | `20`             | Horizontal offset in pixels                                   |
| `offsetY`            | `number`                                                        | `20`             | Vertical offset in pixels                                     |
| `liyaWidgetMode`     | `'standard' \| 'modal_kiosk' \| 'kiosk'`                        | `'standard'`     | Widget display mode                                           |
| `autoSpeak`          | `boolean`                                                       | `true`           | Auto-speak assistant responses                                |
| `animateButton`      | `boolean`                                                       | `true`           | Attention animation on toggle button                          |
| `viewOnPageStart`    | `boolean`                                                       | `false`          | Auto-open widget on page load                                 |
| `closeButtonEnabled` | `boolean`                                                       | `true`           | Show close button                                             |
| `locale`             | `string`                                                        | `''`             | Language — `'tr'` or `'en'` (defaults to browser locale)      |

#### Widget Modes

| Mode           | Description                                          |
| -------------- | ---------------------------------------------------- |
| `standard`     | Floating button in corner, toggles chat panel        |
| `modal_kiosk`  | Opens as centered modal with darkened background     |
| `kiosk`        | Full-screen experience, no toggle                    |

#### Callbacks

| Callback            | Payload  | Description               |
| ------------------- | -------- | ------------------------- |
| `onOpened`          | —        | Chat panel opened         |
| `onClosed`          | —        | Chat panel closed         |
| `onMessageSent`     | `string` | User sent a message       |
| `onMessageReceived` | `string` | Assistant replied         |

---

### `AvatarModal`

Standalone full-screen avatar modal with integrated chat.

```tsx
import { AvatarModal } from "@liyalabs/liya-3d-avatar-widget-react";

function MyApp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AvatarModal
      isOpen={isOpen}
      modelUrl="/models/avatar.glb"
      assistantName="AI Assistant"
      onClose={() => setIsOpen(false)}
    />
  );
}
```

---

### `AvatarScene`

Low-level Three.js 3D avatar renderer. Use for custom integrations.

```tsx
import { AvatarScene } from "@liyalabs/liya-3d-avatar-widget-react";
import type { AvatarSceneHandle } from "@liyalabs/liya-3d-avatar-widget-react";

const sceneRef = useRef<AvatarSceneHandle>(null);

<AvatarScene
  ref={sceneRef}
  modelUrl="/models/avatar.glb"
  width={400}
  height={500}
  isSpeaking={isSpeaking}
  visemes={visemeData}
  currentTime={audioTime}
  lipSyncIntensity={0.5}
/>
```

| Prop               | Type                     | Default | Description                              |
| ------------------ | ------------------------ | ------- | ---------------------------------------- |
| `modelUrl`         | `string`                 | `''`    | GLB/GLTF model URL                       |
| `width`            | `number`                 | `400`   | Canvas width                             |
| `height`           | `number`                 | `500`   | Canvas height                            |
| `isSpeaking`       | `boolean`                | `false` | Trigger speaking animation               |
| `visemes`          | `VisemeData[]`           | `[]`    | Lip-sync timing data from backend        |
| `currentTime`      | `number`                 | `0`     | Audio playback time (drives viseme sync) |
| `lipSyncIntensity` | `number`                 | `0.5`   | Mouth opening intensity (0–1)            |
| `lipSyncSpeed`     | `number`                 | `1.0`   | Lip-sync animation speed multiplier      |
| `onLoaded`         | `() => void`             | —       | Called when model loads                  |
| `onError`          | `(error: Error) => void` | —       | Called on load error                     |

---

## Hooks

### `useChat`

```tsx
const { messages, sendMessage, isLoading, currentSessionId, createSession } = useChat();
```

### `useVoice`

```tsx
const { isRecording, transcript, startRecording, stopRecording } = useVoice();
```

### `useSessions`

```tsx
const { sessions, loadSessions, deleteSession } = useSessions();
```

### `useI18n`

```tsx
const { t, locale, setLocale } = useI18n();
```

---

## API Functions

```tsx
import {
  initializeClient,
  getConfig,
  getAvatarModel,
  generateAvatarSpeech,
  textToSpeech,
  sendMessage,
  uploadFile,
  getSessions,
  createSession,
  deleteSession,
  getSessionHistory,
  getAssistants,
  checkAccess,
  getTaskStatus,
} from "@liyalabs/liya-3d-avatar-widget-react";

// Initialize once at startup
initializeClient({ baseUrl: "...", apiKey: "...", assistantId: "..." });

// Generate speech + lip-sync viseme data
const result = await generateAvatarSpeech("Merhaba!", { voice: "nova" });
// result.audio_base64, result.audio_format, result.visemes

// Text-to-speech only
const audioBlob = await textToSpeech("Merhaba!", { voice: "nova" });

// Chat
const response = await sendMessage({ message: "Hello!", session_id: "..." });

// Sessions
const sessions = await getSessions();
const history = await getSessionHistory(sessionId);

// Files
const fileUrl = await uploadFile(file);
```

---

## Avatar Models

Supports GLB/GLTF models with ARKit-compatible blend shapes:

- **Ready Player Me** avatars (recommended — full ARKit blend shape support)
- Custom models with viseme morph targets

### Supported Viseme Morph Targets

```
viseme_PP, viseme_FF, viseme_TH, viseme_DD, viseme_kk,
viseme_CH, viseme_SS, viseme_nn, viseme_RR, viseme_aa,
viseme_E, viseme_I, viseme_O, viseme_U
```

---

## Backend Requirements

This widget requires the **Liya AI backend**. Full OpenAPI specification available on the developer page:

**[Developer Docs & API Reference →](https://ai.liyalabs.com/developer)**

| Language   | Spec                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------- |
| 🇬🇧 English | [LiyaAi-Api-External-V0-en.yaml](https://ai.liyalabs.com/LiyaAi-Api-External-V0-en.yaml) |
| 🇹🇷 Türkçe  | [LiyaAi-Api-External-V0-tr.yaml](https://ai.liyalabs.com/LiyaAi-Api-External-V0-tr.yaml) |

### Core Endpoints

| Method | Endpoint                                  | Description                   |
| ------ | ----------------------------------------- | ----------------------------- |
| POST   | `/api/v1/external/chat/`                  | Send message, get response    |
| POST   | `/api/v1/external/chat/with-files/`       | Send message with attachments |
| GET    | `/api/v1/external/sessions/`             | List sessions                 |
| POST   | `/api/v1/external/sessions/`             | Create session                |
| DELETE | `/api/v1/external/sessions/{id}/`        | Delete session                |
| GET    | `/api/v1/external/sessions/{id}/history/` | Get chat history              |
| POST   | `/api/v1/external/files/`                | Upload file                   |
| GET    | `/api/v1/external/avatar/model/`         | Get avatar model URL          |
| POST   | `/api/v1/external/avatar/tts/`           | Text-to-speech + visemes      |
| GET    | `/api/v1/external/assistants/`           | List assistants               |
| GET    | `/api/v1/external/access/`              | Check account access level    |
| GET    | `/api/v1/external/config/`              | Get dynamic backend config    |

---

## TypeScript

Full TypeScript support. Key types exported:

```tsx
import type {
  LiyaAvatarWidgetProps,
  AvatarSceneHandle,
  VisemeData,
  ChatMessage,
  Session,
  ThemeConfig,
  WidgetMode,
} from "@liyalabs/liya-3d-avatar-widget-react";
```

---

## Examples

See [`examples/basic/`](./examples/basic/) for a full working React demo covering all three widget modes (standard, modal kiosk, fullscreen kiosk).

---

## Changelog

### 0.1.2
- Replaced `console.log/warn` debug calls with internal `logger` utility
- Removed debug block from avatar API request
- Tasks API: `console.warn` → `logger.warn` for consistent log control

### 0.1.1
- i18n support (Turkish / English)
- Voice input improvements
- Media display in chat messages

### 0.1.0
- Initial release

---

## License

MIT © [LiyaLabs](https://liyalabs.com)
