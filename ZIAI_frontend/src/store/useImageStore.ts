import { useContext, createContext } from 'react';
import type { ImageStore } from '@/types/image';

export const ImageContext = createContext<ImageStore | null>(null);

export function useImageStore() {
  const ctx = useContext(ImageContext);
  if (!ctx) throw new Error('useImageStore must be inside ImageProvider');
  return ctx;
}