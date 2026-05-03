// src/components/ModelSelector.tsx
import { ChevronDown } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { MODELS } from '@/store/models';

export default function ModelSelector() {
  const { selectedModel, setSelectedModel } = useChatStore();
  // const current = MODELS.find((m) => m.id === selectedModel);

  return (
    <div className="relative inline-flex items-center">
      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        className="appearance-none bg-slate-800/60 border border-slate-700/50 text-slate-300 text-xs font-medium pl-3 pr-7 py-1.5 rounded-lg cursor-pointer hover:border-blue-500/40 transition-all focus:outline-none focus:border-blue-500/50"
      >
        {MODELS.map((m) => (
          <option key={m.id} value={m.id} className="bg-[#0a0f18]">
            {m.label}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-2 text-slate-500 pointer-events-none" />
    </div>
  );
}
