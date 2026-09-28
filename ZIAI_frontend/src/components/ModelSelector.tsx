// src/components/ModelSelector.tsx
import { useEffect, useState } from 'react';
import { Brain, Check, ChevronDown, Cpu, Lock, Sparkles, Zap } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { useAuth } from '@/context/useAuth';
import { tokenStore } from '@/api/auth';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

interface ModelOption {
  id: string;
  label: string;
  supports_images?: boolean;
}

const MODEL_META: Record<string, { name: string; description: string; color: string; icon: typeof Zap }> = {
  auto: { name: 'Auto', description: 'Smart model routing', color: 'text-blue-400', icon: Zap },
  llama3: { name: 'Llama 3.1 8B', description: 'Fast and capable', color: 'text-emerald-400', icon: Brain },
  qwen: { name: 'Qwen 2.5 7B', description: 'Balanced performance', color: 'text-cyan-400', icon: Cpu },
  qwen3: { name: 'Qwen 3 4B', description: 'Lightning fast', color: 'text-green-400', icon: Zap },
  mistral: { name: 'Mistral 7B', description: 'Open model', color: 'text-amber-400', icon: Sparkles },
  'gpt-4o-mini': { name: 'GPT-4o Mini', description: 'Fast OpenAI model', color: 'text-green-400', icon: Sparkles },
  'gpt-4o': { name: 'GPT-4o', description: 'OpenAI flagship', color: 'text-green-400', icon: Sparkles },
  'gpt-4-turbo': { name: 'GPT-4 Turbo', description: 'Advanced OpenAI model', color: 'text-green-400', icon: Sparkles },
  'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', description: 'Fast OpenAI model', color: 'text-green-400', icon: Sparkles },
  'claude-haiku': { name: 'Haiku 4.5', description: 'Lightning fast', color: 'text-emerald-400', icon: Brain },
  'claude-3-5-sonnet': { name: 'Sonnet 3.5', description: 'Fast and intelligent', color: 'text-blue-400', icon: Zap },
  'claude-3-opus': { name: 'Opus 3', description: 'Most capable', color: 'text-purple-400', icon: Sparkles },
};

function getModelMeta(model: ModelOption) {
  return MODEL_META[model.id] ?? {
    name: model.label.replace(/\s*\([^)]*\)/g, '').trim(),
    description: 'AI language model',
    color: 'text-cyan-400',
    icon: Cpu,
  };
}

export default function ModelSelector() {
  const { selectedModel, setSelectedModel, setModelSupportsImages } = useChatStore();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels]       = useState<ModelOption[]>([]);
  const [restricted, setRestricted] = useState(false);
  const [loading, setLoading]     = useState(true);

  // Expose whether the current model supports images for other components
  const currentModel = models.find((m) => m.id === selectedModel);
  const modelSupportsImages = currentModel?.supports_images ?? false;

  // Push supports_images into the chat store so MessageInput can check it
  useEffect(() => {
    setModelSupportsImages(modelSupportsImages);
  }, [modelSupportsImages, setModelSupportsImages]);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) return;

    fetch(`${BASE_URL}/chat/models`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((data: { models: ModelOption[]; restricted: boolean }) => {
        setModels(data.models);
        setRestricted(data.restricted);
        // If the currently selected model isn't in the allowed list, snap to the first one
        if (data.models.length && !data.models.some((m) => m.id === selectedModel)) {
          setSelectedModel(data.models[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const selectedOption = models.find((model) => model.id === selectedModel);
  const selectedMeta = selectedOption ? getModelMeta(selectedOption) : null;
  const SelectedIcon = selectedMeta?.icon ?? Cpu;

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        disabled={loading || models.length === 0}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-[#8a8a8f] transition-all hover:bg-white/5 hover:text-white disabled:cursor-wait disabled:opacity-50"
      >
        <SelectedIcon className={`size-4 ${selectedMeta?.color ?? 'text-cyan-400'}`} />
        <span>{selectedMeta?.name ?? (loading ? 'Loading models...' : 'No models')}</span>
        <ChevronDown className={`size-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full left-0 z-50 mb-2 w-[258px] overflow-hidden rounded-xl border border-white/[0.06] bg-[#1b1c20] shadow-2xl shadow-black/60">
            <div className="px-3 pt-1.5 pb-1 text-[10px] font-medium uppercase tracking-wide text-[#686970]">
              Select Model
            </div>
            <div className="max-h-[390px] overflow-y-auto px-0 pb-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10">
              {models.map((model) => {
                const meta = getModelMeta(model);
                const Icon = meta.icon;
                const isSelected = model.id === selectedModel;
                const badge = model.label.match(/\(([^)]+)\)/)?.[1];

                return (
                  <button
                    type="button"
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setIsOpen(false);
                    }}
                    className={`flex min-h-[66px] w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                      isSelected ? 'bg-white/[0.11]' : 'hover:bg-white/[0.05]'
                    }`}
                  >
                    <Icon className={`size-[18px] shrink-0 ${meta.color}`} />
                    <span className="min-w-0 flex-1">
                      <span className={`flex items-center gap-2 text-[16px] font-semibold leading-5 ${isSelected ? 'text-white' : 'text-[#b0b0b5]'}`}>
                        <span className="truncate">{meta.name}</span>
                        {badge && (
                          <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                            {badge}
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block truncate text-[13px] text-[#707178]">
                        {meta.description}
                      </span>
                    </span>
                    {isSelected && <Check className="size-[18px] shrink-0 text-[#4da5fc]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
      {restricted && (
        <span
          className="ml-2 flex items-center gap-1 text-[10px] text-slate-500"
          title="Guest sessions are limited to select models — sign in for full access"
        >
          <Lock size={10} />
          Guest
        </span>
      )}
    </div>
  );
}
