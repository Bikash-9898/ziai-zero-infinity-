import type { GenerationOptions, GeneratedImage } from '@/types/image';
import { BASE_URL } from '@/config';
// const API_BASE = 'http://localhost:8000/api';
// const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

export async function generateImage(
  opts: GenerationOptions,
  userEmail: string
): Promise<GeneratedImage> {
  const response = await fetch(`${BASE_URL}/image/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: opts.prompt,
      negative_prompt: opts.negativePrompt,
      model: opts.model,
      width: opts.width,
      height: opts.height,
      user_id: userEmail,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Image generation failed');
  }

  return response.json();
}

export async function fetchImageHistory(userEmail: string): Promise<GeneratedImage[]> {
  const response = await fetch(`${BASE_URL}/image/history/${encodeURIComponent(userEmail)}`);

  if (!response.ok) {
    throw new Error('Failed to fetch image history');
  }

  const data = await response.json();
  return data.images ?? [];
}

export async function fetchCreditsUsed(userEmail: string): Promise<number> {
  const response = await fetch(`${BASE_URL}/image/credits/${encodeURIComponent(userEmail)}`);

  if (!response.ok) {
    throw new Error('Failed to fetch credits');
  }

  const data = await response.json();
  return data.total_credits_used ?? 0;
}