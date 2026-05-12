# Liya 3D Avatar Widget — React Demo

Interactive demo app for `@liyalabs/liya-3d-avatar-widget-react`. Tests all three widget modes (Standard, Modal Kiosk, Fullscreen Kiosk) with live config loading.

> This example uses the **local source** of the package (not npm), so you can test changes instantly without publishing.

---

## Quick Start

```bash
# From the package root (liya-ai-3d-avatar-react/)
cd examples/basic
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

---

## Configuration

Create a `.env` file in this directory:

```env
VITE_LIYA_API_KEY=your-api-key
VITE_LIYA_BASE_URL=https://app-X-ai.liyalabs.com
VITE_ASSISTANT_ID=your-assistant-id
```

Alternatively, place a `config.php` on your server that returns:

```json
{
  "apiKey": "...",
  "baseUrl": "...",
  "assistantId": "..."
}
```

The demo tries `.env` first; falls back to `config.php`.

---

## Widget Modes

| Mode              | Description                                      |
| ----------------- | ------------------------------------------------ |
| **Standard**      | Floating button in corner, toggles the chat panel |
| **Modal Kiosk**   | Opens as a centered modal with dark overlay      |
| **Fullscreen Kiosk** | Widget fills the entire screen                |

Click a mode card to launch, click again to toggle (Standard) or use the exit bar (Kiosk modes).

---

## Project Structure

```
examples/basic/
├── index.html        # Shell HTML — layout, mode cards, status bar
├── src/
│   └── main.tsx      # React app — config loading, widget lifecycle
├── vite.config.ts    # Aliases package → local src for hot-reload
├── tsconfig.json
└── .env.example      # Copy to .env and fill in your credentials
```

---

## How It Works

- `vite.config.ts` aliases `@liyalabs/liya-3d-avatar-widget-react` → `../../src/index.ts`, so changes to the package source reflect immediately.
- Config is read from `import.meta.env` (`.env` file) or fetched from `/config.php`.
- The React app manages widget lifecycle via `key` prop remounting — switching modes fully resets widget state.
- Kiosk modes show an exit bar (rendered in HTML); the React app exposes `window.__demoApi` for cross-boundary communication.

---

## Requirements

- Node 18+
- A valid Liya AI backend URL and API key ([get one at ai.liyalabs.com](https://ai.liyalabs.com))
