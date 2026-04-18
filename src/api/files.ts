import { getClient } from './client';
import type { UploadedFile } from '../types';

export async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<UploadedFile> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await getClient().post('/api/v1/external/files/upload/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return { id: data.id, name: data.name, size: data.size, type: data.content_type };
}
