// src/store/imageStore.tsx
import { useState, useCallback, useEffect } from 'react';
import type { GenerationOptions, GeneratedImage, ImageStatus } from '@/types/image';
import { generateImage, fetchImageHistory } from '@/services/imageService';
import { useAuth } from '@/context/useAuth';
import { ImageContext } from './useImageStore';

export function ImageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus]                   = useState<ImageStatus>('idle');
  const [currentImage, setCurrentImage]       = useState<string | null>(null);
  const [history, setHistory]                 = useState<GeneratedImage[]>([]);
  const [error, setError]                     = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Fetch history on mount / user change — JWT handles identity, no param needed
  useEffect(() => {
    if (!user?.email) return;
    fetchImageHistory()
      .then(setHistory)
      .catch(console.error);
  }, [user?.email]);

  const generate = useCallback(async (opts: GenerationOptions) => {
    if (!user) return;

    // Each generate call creates a new session
    const sessionId = crypto.randomUUID();
    setActiveSessionId(sessionId);
    setStatus('generating');
    setError(null);

    try {
      const result = await generateImage(opts);
      const resultWithSession: GeneratedImage = { ...result, sessionId };
      setCurrentImage(result.image_url);
      setHistory(prev => [resultWithSession, ...prev]);
      setStatus('success');
    } catch (err: unknown) {
      setError((err as Error).message || 'Generation failed');
      setStatus('error');
    }
  }, [user]);

  // Remove a single image from history
  const deleteImage = useCallback((id: string) => {
    setHistory(prev => prev.filter(img => img.id !== id));
  }, []);

  return (
    <ImageContext.Provider value={{
      status,
      currentImage,
      history,
      error,
      generate,
      setHistory,
      deleteImage,
      activeSessionId,
      setActiveSessionId,
    }}>
      {children}
    </ImageContext.Provider>
  );
}
