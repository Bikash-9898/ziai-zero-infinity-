import { ChevronDown } from 'lucide-react';
import { IMAGE_MODELS } from '@/store/models';
import { useState } from 'react';

interface Props {
  value: string;
  onChange: (modelId: string) => void;
}

export default function ImageModelSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = IMAGE_MODELS.find(m => m.id === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-lg px-3 py-2 text-[11px] font-mono text-slate-400 transition-all min-w-40"
      >
        <span className="flex-1 text-left">{selected?.label ?? 'Select model'}</span>
        <span className="text-[9px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
          {selected?.credits ?? 1.0}cr
        </span>
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-[#080c14] border border-slate-800 rounded-xl overflow-hidden z-50 shadow-xl shadow-black/50">
          {IMAGE_MODELS.map(model => (
            <button
              key={model.id}
              onClick={() => { onChange(model.id); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 transition-all hover:bg-slate-800/60 ${
                model.id === value ? 'bg-blue-950/40' : ''
              }`}
            >
              <div>
                <p className={`text-[11px] font-mono ${model.id === value ? 'text-blue-300' : 'text-slate-300'}`}>
                  {model.label}
                </p>
                <p className="text-[9px] font-mono text-slate-600 mt-0.5 capitalize">
                  {model.provider}
                </p>
              </div>
              <span className="text-[9px] font-mono text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
                {model.credits}cr
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}