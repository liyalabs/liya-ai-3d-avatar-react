import axios, { AxiosInstance } from 'axios';
import type { LiyaChatConfig } from '../types';

let _client: AxiosInstance | null = null;

export function initializeClient(config: LiyaChatConfig): AxiosInstance {
  _client = axios.create({
    baseURL: config.baseUrl || 'https://api.liyalabs.ai',
    timeout: 60_000,
    headers: { 'X-API-Key': config.apiKey, 'Content-Type': 'application/json' },
  });
  return _client;
}

export function getClient(): AxiosInstance {
  if (!_client) throw new Error('LiyaAvatar: call initializeClient() first');
  return _client;
}
