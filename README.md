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

### Avatar Lip-sync in Action

| Idle                                        | Speaking                                           |
| ------------------------------------------- | -------------------------------------------------- |
| ![Avatar Idle](screenshots/avatar-idle.png) | ![Avatar Speaking](screenshots/avatar-lipsync.png) |

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

## Quick Start

### 1. Initialize the Client

Set up the API client with your credentials before rendering any widget:

```tsx
import { initializeClient } from "@liyalabs/liya-3d-avatar-widget-react";

initializeClient({
  baseUrl: "https://app-X-ai.liyalabs.com", // Your assigned backend URL (see GAR section)
  apiKey: "your-api-key",
  assistantId: "your-assistant-id",
});
```

### 2. Use the Widget Component

```tsx
import { LiyaAvatarWidget } from "@liyalabs/3d-avatar";
import "@liyalabs/3d-avatar/style.css";

function App() {
  return (
    <LiyaAvatarWidget
      showAvatarButton={true}
      avatarModelUrl="/models/avatar.glb"
      welcomeMessage="Merhaba! Size nasıl yardımcı olabilirim?"
      onOpened={() => console.log("Widget opened")}
      onMessageSent={(message) => console.log("Message sent:", message)}
    />
  );
}
```

## Components

### LiyaAvatarWidget

Main widget component with chat panel and avatar button.

#### Props

| Prop                 | Type                                                           | Default          | Description                                                   |
| -------------------- | -------------------------------------------------------------- | ---------------- | ------------------------------------------------------------- |
| `position`           | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | `'bottom-right'` | Widget position                                               |
| `theme`              | `ThemeConfig`                                                  | `{}`             | Theme customization                                           |
| `assistantName`      | `string`                                                       | `''`             | Name of the AI assistant                                      |
| `welcomeMessage`     | `string`                                                       | `''`             | Welcome message shown on load                                 |
| `welcomeSuggestions` | `string[]`                                                     | `[]`             | Quick reply suggestions                                       |
| `placeholder`        | `string`                                                       | `''`             | Chat input placeholder                                        |
| `showBranding`       | `boolean`                                                      | `true`           | Show Liya branding                                            |
| `showVoice`          | `boolean`                                                      | `true`           | Show voice input button                                       |
| `voiceEnabled`       | `boolean`                                                      | `true`           | Enable voice (false shows disabled mic for STANDARD accounts) |
| `showAvatarButton`   | `boolean`                                                      | `true`           | Show "Talk with Avatar" button                                |
| `avatarModelUrl`     | `string`                                                       | `''`             | URL to GLB/GLTF avatar model                                  |
| `offsetX`            | `number`                                                       | `20`             | Horizontal offset in pixels                                   |
| `offsetY`            | `number`                                                       | `20`             | Vertical offset in pixels                                     |
| `liyaWidgetMode`     | `'standard' \| 'modal_kiosk' \| 'kiosk'`                       | `'standard'`     | Widget display mode                                           |
| `autoSpeak`          | `boolean`                                                      | `true`           | Auto-speak assistant responses                                |
| `animateButton`      | `boolean`                                                      | `true`           | Attention animation on toggle button                          |
| `viewOnPageStart`    | `boolean`                                                      | `false`          | Auto-open widget on page load                                 |
| `closeButtonEnabled` | `boolean`                                                      | `true`           | Show close button                                             |
| `locale`             | `string`                                                       | `''`             | Language (`'tr'` or `'en'`, defaults to browser)              |

#### Callbacks

| Callback            | Payload  | Description         |
| ------------------- | -------- | ------------------- |
| `onOpened`          | —        | Chat panel opened   |
| `onClosed`          | —        | Chat panel closed   |
| `onMessageSent`     | `string` | User sent a message |
| `onMessageReceived` | `string` | Assistant responded |

### AvatarModal

Standalone full-screen avatar modal with integrated chat.

```tsx
import { AvatarModal } from "@liyalabs/3d-avatar";

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

### AvatarScene

Low-level 3D avatar renderer (Three.js). Use this for custom integrations.

```tsx
import { AvatarScene } from "@liyalabs/3d-avatar";
import type { AvatarSceneHandle } from "@liyalabs/3d-avatar";

function MyApp() {
  const sceneRef = useRef<AvatarSceneHandle>(null);

  return (
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
  );
}
```

#### AvatarScene Key Props

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

## Hooks

### useChat

Manage chat sessions and messages.

```tsx
import { useChat } from "@liyalabs/3d-avatar";

function MyComponent() {
  const { messages, sendMessage, isLoading, currentSessionId, createSession } =
    useChat();

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <button onClick={() => sendMessage("Hello!")}>Send</button>
    </div>
  );
}
```

### useVoice

Speech-to-text voice input.

```tsx
import { useVoice } from "@liyalabs/3d-avatar";

function MyComponent() {
  const { isRecording, transcript, startRecording, stopRecording } = useVoice();

  return (
    <button onClick={isRecording ? stopRecording : startRecording}>
      {isRecording ? "Stop" : "Record"}
    </button>
  );
}
```

### useSessions

Manage chat sessions.

```tsx
import { useSessions } from "@liyalabs/3d-avatar";

function MyComponent() {
  const { sessions, loadSessions, deleteSession } = useSessions();

  useEffect(() => {
    loadSessions();
  }, []);

  return (
    <ul>
      {sessions.map((s) => (
        <li key={s.id}>
          {s.title}
          <button onClick={() => deleteSession(s.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

### useI18n

Internationalization hook.

```tsx
import { useI18n } from "@liyalabs/3d-avatar";

function MyComponent() {
  const { t, locale, setLocale } = useI18n();

  return (
    <div>
      <p>{t("welcome")}</p>
      <button onClick={() => setLocale("en")}>English</button>
      <button onClick={() => setLocale("tr")}>Türkçe</button>
    </div>
  );
}
```

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
} from "@liyalabs/3d-avatar";

// Initialize the API client (call once at app startup)
initializeClient({ baseUrl: "...", apiKey: "...", assistantId: "..." });

// Get dynamic backend config
const config = await getConfig();

// Get avatar model URL
const model = await getAvatarModel();

// Generate speech with viseme data for lip-sync
const result = await generateAvatarSpeech("Merhaba!", { voice: "nova" });
console.log(result.visemes); // Lip-sync timing data
console.log(result.audio_base64); // Base64-encoded audio
console.log(result.audio_format); // 'mp3' (iOS/Safari) or 'opus' (others)

// Text-to-speech only (no visemes)
const audioBlob = await textToSpeech("Merhaba!", { voice: "nova", speed: 1.0 });

// Send chat message
const response = await sendMessage({ message: "Hello!", session_id: "..." });

// File upload
const fileUrl = await uploadFile(file);

// Session management
const sessions = await getSessions();
const history = await getSessionHistory(sessionId);
```

## Avatar Models

The widget supports GLB/GLTF models with ARKit-compatible blend shapes for lip-sync:

- **Ready Player Me** avatars (recommended — full ARKit blend shape support)
- Custom models with viseme morph targets

### Supported Viseme Morph Targets

```
viseme_PP, viseme_FF, viseme_TH, viseme_DD, viseme_kk,
viseme_CH, viseme_SS, viseme_nn, viseme_RR, viseme_aa,
viseme_E, viseme_I, viseme_O, viseme_U
```

## Backend Requirements

This widget requires the Liya AI backend. The complete OpenAPI specification (**LiyaAi-Api-External-V0**, v0.1.0) is available on the developer page:

**[Developer Docs & API Reference →](https://ai.liyalabs.com/developer)**

Download the spec directly (Endpoints tab → OpenAPI Specification):

| Language   | View / Download                                                                          |
| ---------- | ---------------------------------------------------------------------------------------- |
| 🇬🇧 English | [LiyaAi-Api-External-V0-en.yaml](https://ai.liyalabs.com/LiyaAi-Api-External-V0-en.yaml) |
| 🇹🇷 Türkçe  | [LiyaAi-Api-External-V0-tr.yaml](https://ai.liyalabs.com/LiyaAi-Api-External-V0-tr.yaml) |

The spec follows Semantic Versioning. While on **0.x**, breaking changes may occur without prior notice — subscribe to [liyalabs.com/changelog](https://liyalabs.com/changelog).

### Core Endpoints Used

| Method | Endpoint                                  | Description                         |
| ------ | ----------------------------------------- | ----------------------------------- |
| POST   | `/api/v1/external/chat/`                  | Send message, get response          |
| POST   | `/api/v1/external/chat/with-files/`       | Send message with file attachments  |
| GET    | `/api/v1/external/sessions/`              | List sessions                       |
| POST   | `/api/v1/external/sessions/`              | Create session                      |
| DELETE | `/api/v1/external/sessions/{id}/`         | Delete session                      |
| GET    | `/api/v1/external/sessions/{id}/history/` | Get chat history                    |
| POST   | `/api/v1/external/files/`                 | Upload file                         |
| GET    | `/api/v1/external/assistants/`            | List assistants                     |
| POST   | `/api/v1/external/tts/`                   | Text-to-speech (audio blob)         |
| POST   | `/api/v1/external/avatar/speech/`         | TTS with viseme data (PREMIUM+)     |
| GET    | `/api/v1/external/avatar/model/`          | Get avatar model URL (PREMIUM+)     |
| GET    | `/api/v1/external/user/access/`           | Check feature access                |
| GET    | `/api/v1/external/tasks/{id}/status/`     | Async task status (image/video gen) |

### Authentication

All requests require the `X-API-Key` header:

```
X-API-Key: your-api-key
```

Get your API key from your [Liya AI Dashboard](https://ai.liyalabs.com) under **Projects → API Keys**.

## Theme Customization

```tsx
<LiyaAvatarWidget
  theme={{
    primaryColor: "#6366f1",
    backgroundColor: "#ffffff",
    textColor: "#374151",
    borderRadius: "16px",
    fontFamily: "Inter, sans-serif",
    position: "bottom-right",
    widgetSize: "medium",
    zIndex: 9999,
  }}
/>
```

## GAR (Global Application Router)

Liya AI uses a distributed backend architecture. Each project is routed to a specific backend instance via GAR.

Your backend URL is shown in your dashboard under **Settings → API Configuration**:

```
https://app-{X}-ai.liyalabs.com
```

Where `{X}` is your assigned instance number.

| Instance | Backend URL                     |
| -------- | ------------------------------- |
| 1        | `https://app-1-ai.liyalabs.com` |
| 2        | `https://app-2-ai.liyalabs.com` |
| 3        | `https://app-3-ai.liyalabs.com` |

Use this URL as the `baseUrl` in your `initializeClient()` call.

## Account Types & Feature Access

| Feature            | STANDARD | PREMIUM | PREMIUM PLUS |
| ------------------ | -------- | ------- | ------------ |
| Chat               | ✅       | ✅      | ✅           |
| File Upload        | ❌       | ✅      | ✅           |
| Voice Input (STT)  | ✅       | ✅      | ✅           |
| Voice Output (TTS) | ❌       | ✅      | ✅           |
| 3D Avatar          | ❌       | ✅      | ✅           |
| Custom Avatar      | ❌       | ❌      | ✅           |
| Kiosk Mode         | ❌       | ❌      | ✅           |

## Browser Support

| Browser     | Chat | Voice Input     | 3D Avatar | Audio |
| ----------- | ---- | --------------- | --------- | ----- |
| Chrome 90+  | ✅   | ✅              | ✅        | Opus  |
| Firefox 90+ | ✅   | ✅              | ✅        | Opus  |
| Safari 15+  | ✅   | ✅ (iPadOS 16+) | ✅        | MP3   |
| Edge 90+    | ✅   | ✅              | ✅        | Opus  |
| iOS Safari  | ✅   | ✅ (iOS 16+)    | ✅        | MP3   |

**Minimum requirements:** ES6+, WebGL 1.0, AudioContext

## Changelog

### 0.1.0

- Initial public release
- 3D avatar with real-time lip-sync
- Voice input/output
- File upload support
- Session history
- Multi-language support (TR/EN)
- Standard, modal_kiosk, and kiosk modes
- React 18+ support

## Live Demo

- **Platform**: [ai.liyalabs.com](https://ai.liyalabs.com) — Create an assistant and interact with the 3D avatar
- **Website**: [liyalabs.com](https://liyalabs.com)

## License

MIT © Liya Labs

## Support

- 🌐 Website: [liyalabs.com](https://liyalabs.com)
- 📖 API Docs: [ai.liyalabs.com/developer](https://ai.liyalabs.com/developer)
- 🐛 Issues: [GitHub Issues](https://github.com/liyalabs/liya-ai-3d-avatar-react/issues)
- 📧 Email: support@liyalabs.com
