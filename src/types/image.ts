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
  image_url: string;
  prompt: string;
  model: string;
  created_at: string;
  generation_time_ms?: number;
  sessionId?: string;   
}

export interface ImageStore {
  status:        ImageStatus;
  currentImage:  string | null;
  history:       GeneratedImage[];
  error:         string | null;
  generate:      (opts: GenerationOptions) => Promise<void>;
  setHistory:    (h: GeneratedImage[]) => void;
  deleteImage:   (id: string) => void;               // removes one image from history
  activeSessionId: string | null;                    // currently viewed session
  setActiveSessionId: (id: string | null) => void;
}

// export interface ImageStore {
//   status: ImageStatus;
//   currentImage: string | null;
//   history: GeneratedImage[];
//   error: string | null;
//   generate: (opts: GenerationOptions) => Promise<void>;
//   setHistory: (h: GeneratedImage[]) => void;
// }