import { getClient } from './client';
import type { SpeechResponse } from '../types';

export async function generateSpeech(text: string, assistantId?: string): Promise<SpeechResponse> {
  const { data } = await getClient().post('/api/v1/external/avatar/speech/', {
    text,
    assistant_id: assistantId,
  });
  return {
    audioUrl: data.audio_url,
    visemes: data.visemes ?? [],
    duration: data.duration ?? 0,
  };
}

export async function fetchAvatarModel(assistantId: string): Promise<string> {
  const { data } = await getClient().get(`/api/v1/external/avatar/model/${assistantId}`);
  return data.model_url;
}
