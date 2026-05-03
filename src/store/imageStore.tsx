import { useState, useCallback } from 'react';
import type { GenerationOptions, GeneratedImage, ImageStatus } from '@/types/image';
import { generateImage } from '@/services/imageService';
import { useAuth } from '@/context/useAuth';
import { ImageContext } from './useImageStore';

export function ImageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus]             = useState<ImageStatus>('idle');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory]           = useState<GeneratedImage[]>([]);
  const [error, setError]               = useState<string | null>(null);

const generate = useCallback(async (opts: GenerationOptions) => {
  if (!user?.email) return;   // ← was user?.id

  setStatus('generating');
  setError(null);
  try {
    const result = await generateImage(opts, user.email);  // ← pass email
    setCurrentImage(result.image_url);
    setHistory(prev => [result, ...prev]);
    setStatus('success');
  } catch (err: unknown) {
    setError((err as Error).message || 'Generation failed');
    setStatus('error');
  }
}, [user]);

  return (
    <ImageContext.Provider value={{ status, currentImage, history, error, generate, setHistory }}>
      {children}
    </ImageContext.Provider>
  );
}