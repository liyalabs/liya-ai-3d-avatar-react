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

// Components
export * from "./components/widget";
export * from "./components/app";
export * from "./components/shared";

// Hooks — resetGlobalChat is exported from useChat for external cleanup
export * from "./hooks/useChat";
export * from "./hooks/useVoice";
export * from "./hooks/useAvatarColors";
export * from "./hooks/useI18n";
export * from "./hooks/useSessions";

// API & Types
export * from "./api";
export * from "./types";

// Utils
export * from "./utils/color";

// Styles
import "./components/widget/LiyaAvatarWidget.css";
