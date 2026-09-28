// src/services/imageService.ts
import { apiJson } from '@/api/apiClient';   // ← JWT-aware, no hardcoded URL
import type { GeneratedImage, GenerationOptions } from '@/types/image';

/**
 * Generate an image.
 * user_id NOT sent in body — backend reads identity from JWT.
 */
export async function generateImage(opts: GenerationOptions): Promise<GeneratedImage> {
  return apiJson<GeneratedImage>('/image/generate', {
    method: 'POST',
    body: JSON.stringify({
      prompt:          opts.prompt,
      negative_prompt: opts.negativePrompt,
      model:           opts.model,
      width:           opts.width,
      height:          opts.height,
    }),
  });
}

/**
 * Fetch image generation history for the current user.
 * No user email in URL — backend reads identity from JWT.
 */
export async function fetchImageHistory(): Promise<GeneratedImage[]> {
  const data = await apiJson<{ images: GeneratedImage[] }>('/image/history');
  return data.images;
}

/**
 * Fetch total credits used by the current user.
 */
export async function fetchCreditsUsed(): Promise<number> {
  const data = await apiJson<{ total_credits_used: number }>('/image/credits');
  return data.total_credits_used ?? 0;
}
