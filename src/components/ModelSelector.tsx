// src/components/ModelSelector.tsx
import { useEffect, useState } from 'react';
import { ChevronDown, Lock } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { useAuth } from '@/context/useAuth';
import { MODELS } from '@/store/models';
import { tokenStore } from '@/api/auth';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

export default function ModelSelector() {
  const { selectedModel, setSelectedModel } = useChatStore();
  const { user } = useAuth();
  const [allowedIds, setAllowedIds] = useState<string[] | null>(null); // null = not restricted (show all)

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) return;

    fetch(`${BASE_URL}/chat/models`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((data: { models: string[]; restricted: boolean }) => {
        if (data.restricted) {
          setAllowedIds(data.models);
          // If the currently selected model isn't allowed, snap to the first allowed one
          if (!data.models.includes(selectedModel)) {
            setSelectedModel(data.models[0]);
          }
        } else {
          setAllowedIds(null);
        }
      })
      .catch(() => setAllowedIds(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const visibleModels = allowedIds ? MODELS.filter((m) => allowedIds.includes(m.id)) : MODELS;

  return (
    <div className="relative inline-flex items-center">
      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        className="appearance-none bg-slate-800/60 border border-slate-700/50 text-slate-300 text-xs font-medium pl-3 pr-7 py-1.5 rounded-lg cursor-pointer hover:border-blue-500/40 transition-all focus:outline-none focus:border-blue-500/50"
      >
        {visibleModels.map((m) => (
          <option key={m.id} value={m.id} className="bg-[#0a0f18]">
            {m.label}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-2 text-slate-500 pointer-events-none" />
      {allowedIds && (
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
