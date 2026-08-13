import { apiFetch, apiJson } from './apiClient';

export interface LibraryItem {
  id: string;
  original_name: string;
  filename: string;
  url: string;
  mime_type: string;
  category: string;
  size: number;
  created_at: string | null;
}

export async function getLibraryItems(): Promise<LibraryItem[]> {
  return apiJson<LibraryItem[]>('/library/');
}

export async function uploadLibraryItems(files: File[]): Promise<{
  items: LibraryItem[];
}> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const res = await apiFetch('/library/upload', {
    method: 'POST',
    body: formData,
  });

  return res.json() as Promise<{ items: LibraryItem[] }>;
}

export async function deleteLibraryItem(itemId: string): Promise<void> {
  await apiFetch(`/library/${itemId}`, {
    method: 'DELETE',
  });
}
