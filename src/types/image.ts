export type ImageStatus = 'idle' | 'generating' | 'success' | 'error';

export interface ImageModel {
  id: string;
  name: string;
  provider: string;
  credits_per_image: number;
}

export interface GenerationOptions {
  prompt: string;
  negativePrompt?: string;
  model: string;
  width: number;
  height: number;
}

export interface GeneratedImage {
  id: string;
  image_url: string;       // ← snake_case, matches DB + backend
  prompt: string;
  model: string;
  created_at: string;      // ← rename createdAt to created_at
  generation_time_ms?: number;
}

// ← add this
export interface ImageStore {
  status: ImageStatus;
  currentImage: string | null;
  history: GeneratedImage[];
  error: string | null;
  generate: (opts: GenerationOptions) => Promise<void>;
  setHistory: (h: GeneratedImage[]) => void;
}