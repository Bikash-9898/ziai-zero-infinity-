export const MODELS: { id: string; label: string }[] = [
  { id: 'llama3',  label: 'Llama 3.1 8B  (recommended)' },
  { id: 'qwen',    label: 'Qwen 2.5 7B' },
  { id: 'qwen3',   label: 'Qwen 3 4B  (fast)' },
  { id: 'mistral', label: 'Mistral 7B' },
];


export const IMAGE_MODELS: { id: string; label: string; provider: string; credits: number }[] = [
  { id: 'flux',        label: 'FLUX.1  (recommended)', provider: 'pollinations', credits: 1.0 },
  { id: 'turbo',       label: 'SDXL Turbo  (fast)',    provider: 'pollinations', credits: 0.5 },
  { id: 'gptimage1',   label: 'GPT Image 1',           provider: 'pollinations', credits: 1.0 },
  { id: 'midjourney',  label: 'Midjourney  (quality)', provider: 'pollinations', credits: 1.5 },
  { id: 'sdxl',  label: 'Stable Diffusion XL', provider: 'Huggingface', credits: 1.0 },
];