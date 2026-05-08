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

  // ← fetch history on mount / user change (removed from ImageTab)
  useEffect(() => {
    if (user?.email) {
      fetchImageHistory(user.email)
        .then(setHistory)
        .catch(console.error);
    }
  }, [user?.email]);

  const generate = useCallback(async (opts: GenerationOptions) => {
    if (!user?.email) return;

    setStatus('generating');
    setError(null);
    try {
      const result = await generateImage(opts, user.email);
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