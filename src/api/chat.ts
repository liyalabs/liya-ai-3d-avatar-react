import { getClient } from './client';
import type { ChatResponse } from '../types';

export async function sendMessage(
  message: string,
  sessionId?: string | null,
  assistantId?: string,
): Promise<ChatResponse> {
  const { data } = await getClient().post('/api/v1/external/chat/', {
    message,
    session_id: sessionId || undefined,
    assistant_id: assistantId,
  });
  return { sessionId: data.session_id, message: data.message, annotations: data.annotations };
}

export async function sendMessageWithFiles(
  message: string,
  fileIds: string[],
  sessionId?: string | null,
  assistantId?: string,
): Promise<ChatResponse> {
  const { data } = await getClient().post('/api/v1/external/chat/with-files/', {
    message,
    file_ids: fileIds,
    session_id: sessionId || undefined,
    assistant_id: assistantId,
  });
  return { sessionId: data.session_id, message: data.message };
}
