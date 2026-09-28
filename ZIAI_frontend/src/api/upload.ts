// src/api/upload.ts
/**
 * Chat attachment upload — reuses the Library's /library/upload endpoint
 * (app.routers.library_router) rather than a separate /upload route, so
 * files attached in chat also show up in the user's Library automatically.
 * Kept as raw XHR (not apiClient) so we can report upload progress.
 */
import { tokenStore } from './auth';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

export interface UploadedFileResult {
  id: string;
  original_name: string;
  filename: string;
  url: string;
  mime_type: string;
  category: string;
  size: number;
}

export const uploadFiles = async (
  files: File[],
  onProgress?: (progress: number) => void
): Promise<{ files: UploadedFileResult[] }> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(Math.round(percentComplete));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          // library_router returns { items: [...] } — normalize to { files: [...] }
          resolve({ files: data.items ?? data.files ?? [] });
        } catch {
          reject(new Error('Could not parse upload response'));
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(new Error(errorResponse.detail || 'Upload failed'));
        } catch {
          reject(new Error('Upload failed'));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));

    xhr.open('POST', `${API_BASE}/library/upload`);
    const token = tokenStore.get();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(formData);
  });
};
