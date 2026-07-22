// src/components/AdminGuestModelSettings.tsx
import { useEffect, useState } from 'react';
import { Check, Loader2, Save } from 'lucide-react';
import { BASE_URL, ADMIN_SECRET_KEY } from '@/config';

interface GuestModelSettings {
  available_models: string[];
  allowed_models: string[];
}

export default function AdminGuestModelSettings() {
  const [data, setData]         = useState<GuestModelSettings | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/admin/settings/guest-models`, {
      headers: { 'X-Admin-Key': ADMIN_SECRET_KEY },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((res: GuestModelSettings) => {
        setData(res);
        setSelected(new Set(res.allowed_models));
      })
      .catch(() => setError('Failed to load guest model settings'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (model: string) => {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(model)) {
        if (next.size === 1) return prev; // must keep at least one selected
        next.delete(model);
      } else {
        next.add(model);
      }
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/settings/guest-models`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': ADMIN_SECRET_KEY,
        },
        body: JSON.stringify({ allowed_models: Array.from(selected) }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to save — please try again');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-40 rounded-2xl bg-slate-800/40 animate-pulse" />;

  if (error && !data) {
    return (
      <div className="text-red-400 text-sm bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-[#0d1224] border border-slate-800 rounded-2xl px-6 py-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest m-0">
          Guest Chat — Allowed Models
        </p>
      </div>
      <p className="text-xs text-slate-500 mt-2 mb-4">
        Not-signed-in visitors are always restricted to these models server-side,
        regardless of what the chat UI shows them. Pick cheap/self-hosted models
        to protect your margin on free trial usage.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
        {data?.available_models.map((model) => {
          const isSelected = selected.has(model);
          return (
            <button
              key={model}
              onClick={() => toggle(model)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                isSelected
                  ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-300'
                  : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600'
              }`}
            >
              <span
                className={`w-4 h-4 shrink-0 rounded flex items-center justify-center border ${
                  isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'
                }`}
              >
                {isSelected && <Check size={11} className="text-white" />}
              </span>
              <span className="truncate">{model}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-xs font-bold transition-all"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {saved && <span className="text-emerald-400 text-xs font-medium">Saved</span>}
        {error && data && <span className="text-red-400 text-xs">{error}</span>}
      </div>
    </div>
  );
}
