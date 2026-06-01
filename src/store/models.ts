export const MODELS: { id: string; label: string }[] = [
  { id: 'llama3',  label: 'Llama 3.1 8B  (recommended)' },
  { id: 'qwen',    label: 'Qwen 2.5 7B' },
  { id: 'qwen3',   label: 'Qwen 3 4B  (fast)' },
  { id: 'mistral', label: 'Mistral 7B' },

  // OpenAI
  { id: 'gpt-4o-mini',   label: 'GPT-4o Mini' },
  { id: 'gpt-4o',        label: 'GPT-4o' },
  { id: 'gpt-4-turbo',   label: 'GPT-4 Turbo' },
  { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (fast)' },

  // Anthropic (Claude)
  { id: 'claude-haiku',        label: 'Claude Haiku 4.5 (fast)' },
  { id: 'claude-3-5-sonnet',   label: 'Claude Sonnet 3.5' },
  { id: 'claude-3-opus',       label: 'Claude Opus 3' },
];


export const IMAGE_MODELS: { id: string; label: string; provider: string; credits: number }[] = [
  { id: 'flux',        label: 'FLUX.1  (recommended)', provider: 'pollinations', credits: 1.0 },
  { id: 'turbo',       label: 'FLUX.1-schnell',    provider: 'huggingface', credits: 0.5 },
  { id: 'sdxl',  label: 'Stable Diffusion 3.5 Large', provider: 'Huggingface', credits: 1.0 },
];