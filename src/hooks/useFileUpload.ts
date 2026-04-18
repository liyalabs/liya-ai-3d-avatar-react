import { useState, useCallback } from 'react';
import { uploadFile } from '../api/files';
import type { PendingFile, UploadedFile } from '../types';

const MAX_SIZE = 20 * 1024 * 1024;

export function useFileUpload() {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    const valid = Array.from(files).filter((f) => f.size <= MAX_SIZE);
    setPendingFiles((prev) => [...prev, ...valid.map((file) => ({ file }))]);
  }, []);

  const uploadAll = useCallback(async (): Promise<string[]> => {
    if (!pendingFiles.length) return uploadedFiles.map((f) => f.id);
    setIsUploading(true);
    try {
      const results = await Promise.all(pendingFiles.map((pf) => uploadFile(pf.file)));
      setUploadedFiles((prev) => [...prev, ...results]);
      setPendingFiles([]);
      return [...uploadedFiles, ...results].map((f) => f.id);
    } finally { setIsUploading(false); }
  }, [pendingFiles, uploadedFiles]);

  const clear = useCallback(() => { setPendingFiles([]); setUploadedFiles([]); }, []);

  return { pendingFiles, uploadedFiles, isUploading, hasPendingFiles: pendingFiles.length > 0, addFiles, uploadAll, clear };
}
