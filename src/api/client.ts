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
// Liya AI Chat - HTTP Client (React Version)
import axios, { AxiosInstance, AxiosError } from "axios";
import type { ApiResponse, LiyaChatConfig } from "../types";
import { logger } from "../utils/logger";

let apiClient: AxiosInstance | null = null;
let currentConfig: LiyaChatConfig | null = null;

/** Reset the singleton — call before reinitializing with new credentials */
export function resetClient(): void {
  apiClient = null;
  currentConfig = null;
  logger.log("[LiyaClient] 🔄 resetClient — singleton cleared");
}

/**
 * Safe re-initialize: only resets if credentials actually changed.
 * Prevents React StrictMode double-mount from wiping a valid client.
 */
export function reinitializeClient(config: LiyaChatConfig): AxiosInstance {
  const credentialsChanged =
    !currentConfig ||
    currentConfig.apiKey !== config.apiKey ||
    currentConfig.baseUrl !== config.baseUrl ||
    currentConfig.assistantId !== config.assistantId;

  if (credentialsChanged) {
    logger.log(
      "[LiyaClient] 🔄 reinitializeClient — credentials changed, reinit",
    );
    return initializeClient(config);
  }

  // Same credentials → reuse existing client, just update optional fields
  if (currentConfig) {
    currentConfig = { ...currentConfig, ...config };
  }
  logger.log(
    "[LiyaClient] ♻️ reinitializeClient — same credentials, reusing existing client",
  );
  return apiClient!;
}

export function initializeClient(config: LiyaChatConfig): AxiosInstance {
  logger.log("[LiyaClient] 🔧 initializeClient called", {
    baseUrl: config.baseUrl,
    assistantId: config.assistantId,
    hasApiKey: !!config.apiKey,
    mode: config.mode,
    locale: config.locale,
    avatarModelUrl: config.avatarModelUrl,
  });

  // Always reinitialize — ensures fresh credentials on every mount
  currentConfig = config;

  apiClient = axios.create({
    baseURL: config.baseUrl,
    timeout: 60000,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": config.apiKey,
    },
  });

  // Request interceptor
  apiClient.interceptors.request.use(
    (requestConfig) => {
      return requestConfig;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // Response interceptor
  apiClient.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError<ApiResponse>) => {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      logger.error("[LiyaClient] ❌ API error:", {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: errorMessage,
        data: error.response?.data,
      });
      return Promise.reject(new Error(errorMessage));
    },
  );

  logger.log("[LiyaClient] ✅ Axios client created, baseURL:", config.baseUrl);
  return apiClient;
}

export function getClient(): AxiosInstance {
  if (!apiClient) {
    throw new Error(
      "[LiyaChat] API client not initialized. Call initializeClient first.",
    );
  }
  return apiClient;
}

export function getConfig(): LiyaChatConfig {
  if (!currentConfig) {
    throw new Error("[LiyaChat] Config not set. Initialize the widget first.");
  }
  return currentConfig;
}

// Debug helper — logs current config state (no sensitive data)
export function debugConfig(): void {
  logger.log("[LiyaClient] 📋 Current config state:", {
    isInitialized: apiClient !== null && currentConfig !== null,
    baseUrl: currentConfig?.baseUrl,
    assistantId: currentConfig?.assistantId,
    hasApiKey: !!currentConfig?.apiKey,
    avatarModelUrl: currentConfig?.avatarModelUrl,
    locale: currentConfig?.locale,
  });
}

export function isInitialized(): boolean {
  return apiClient !== null && currentConfig !== null;
}
