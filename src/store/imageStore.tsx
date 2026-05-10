// src/store/imageStore.tsx
import { useState, useCallback, useEffect } from 'react';
import type { GenerationOptions, GeneratedImage, ImageStatus } from '@/types/image';
import { generateImage, fetchImageHistory } from '@/services/imageService';
import { useAuth } from '@/context/useAuth';
import { ImageContext } from './useImageStore';

export function ImageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus]             = useState<ImageStatus>('idle');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory]           = useState<GeneratedImage[]>([]);
  const [error, setError]               = useState<string | null>(null);

  // Fetch history on mount / user change
  // No email needed — JWT handles identity
  useEffect(() => {
    if (!user?.email) return;
    fetchImageHistory()           // ← no userEmail param
      .then(setHistory)
      .catch(console.error);
  }, [user?.email]);

  const generate = useCallback(async (opts: GenerationOptions) => {
    if (!user) return;            // ← guard on user existence, not email

    setStatus('generating');
    setError(null);
    try {
      const result = await generateImage(opts);   // ← no userEmail param
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
