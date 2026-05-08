import { useEffect, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { BASE_URL } from '@/config';

// const API_BASE = "http://localhost:8000/api"; // ← change this to your backend URL

interface ImageModel {
  id: string;
  name: string;
  provider: string;
  credits_per_image: number;
}

interface Props {
  value: string;
  onChange: (modelId: string) => void;
  onModelsLoaded?: (models: ImageModel[]) => void;
}

export default function ImageModelSelector({ value, onChange, onModelsLoaded }: Props) {
  const [models, setModels]     = useState<ImageModel[]>([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);

  // useEffect(() => {
  //   fetch(`${API_BASE}/image/models`)
  //     .then(r => r.json())
  //     .then(data => { setModels(data); setLoading(false); })
  //     .catch(() => setLoading(false));
  // }, []);
  useEffect(() => {
    fetch(`${BASE_URL}/image/models`)
      .then(r => {
        console.log('Models status:', r.status);  // ← add this
        return r.json();
      })
      .then(data => {
        console.log('Models data:', data);        // ← add this
        setModels(data);
        onModelsLoaded?.(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Models fetch failed:', err); // ← add this
        setLoading(false);
      });
  }, []);

  const selected = models.find(m => m.id === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-lg px-3 py-2 text-[11px] font-mono text-slate-400 transition-all min-w-40"
      >
        {loading ? (
          <Loader2 size={11} className="animate-spin text-slate-600" />
        ) : (
          <>
            <span className="flex-1 text-left">
              {selected?.name ?? 'Select model'}
            </span>
            {selected && (
              <span className="text-[9px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
                {selected.credits_per_image}cr
              </span>
            )}
            <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && !loading && (
        <div className="absolute top-full left-0 mt-1.5 w-45 h-30 bg-[#080c14] border border-slate-800 rounded-xl z-50 shadow-xl shadow-black/50 overflow-y-auto">
          {models.map(model => (
            <button
              key={model.id}
              onClick={() => { onChange(model.id); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-all hover:bg-slate-800/60 ${
                model.id === value ? 'bg-blue-950/40' : ''
              }`}
            >
              <div>
                <p className={`text-[11px] font-mono ${model.id === value ? 'text-blue-300' : 'text-slate-300'}`}>
                  {model.name}
                </p>
                <p className="text-[9px] font-mono text-slate-600 mt-0.5 capitalize">
                  {model.provider}
                </p>
              </div>
              <span className="text-[9px] font-mono text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
                {model.credits_per_image}cr
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}