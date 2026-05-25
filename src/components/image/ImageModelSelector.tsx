// src/components/image/ImageModelSelector.tsx
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { apiJson } from '@/api/apiClient';
import type { ImageModel } from '@/types/image';

interface Props {
  value: string;
  onChange: (modelId: string) => void;
  onModelsLoaded?: (models: ImageModel[]) => void;
}

export default function ImageModelSelector({ value, onChange, onModelsLoaded }: Props) {
  const [models, setModels]   = useState<ImageModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const onModelsLoadedRef     = useRef(onModelsLoaded); // stable ref — no effect re-runs

  useEffect(() => {
    apiJson<ImageModel[]>('/image/models')
      .then(data => {
        setModels(data);
        onModelsLoadedRef.current?.(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []); // runs once only

  const selected = models.find(m => m.id === value);

  return (
    <div className="relative">
      {/* Trigger — full width to fill its grid cell */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-2 bg-white/3 border border-white/10 hover:bg-white/5 hover:border-white/20 rounded-lg px-3 py-2 text-[11px] font-mono text-slate-400 transition-all"
      >
        {loading ? (
          <Loader2 size={11} className="animate-spin text-slate-600" />
        ) : (
          <>
            <span className="flex-1 text-left truncate">
              {selected?.name ?? 'Select model'}
            </span>
            {selected && (
              <span className="text-[9px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded shrink-0">
                {selected.credits_per_image}cr
              </span>
            )}
            <ChevronDown
              size={11}
              className={`transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {/* Dropdown — fixed max-height with proper scroll */}
      {open && !loading && (
        <div className="absolute top-full left-0 mt-1.5 w-full max-h-48 overflow-y-auto bg-[#2a2a2a] border border-white/10 rounded-xl z-50 shadow-xl shadow-black/60">
          {models.map(model => (
            <button
              key={model.id}
              onClick={() => { onChange(model.id); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-all hover:bg-white/5 ${
                model.id === value ? 'bg-purple-600/15' : ''
              }`}
            >
              <div className="min-w-0">
                <p className={`text-[11px] font-mono truncate ${
                  model.id === value ? 'text-purple-300' : 'text-slate-300'
                }`}>
                  {model.name}
                </p>
                <p className="text-[9px] font-mono text-slate-600 mt-0.5 capitalize">
                  {model.provider}
                </p>
              </div>
              <span className="text-[9px] font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 rounded shrink-0 ml-2">
                {model.credits_per_image}cr
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
