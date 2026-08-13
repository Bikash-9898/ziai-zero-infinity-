// src/components/AdminImageModelRegistry.tsx
import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { BASE_URL, ADMIN_SECRET_KEY } from '@/config';
import type { ImageModelRow } from '@/types/types';

const PROVIDERS = ['huggingface', 'fal', 'pollinations'];

const EMPTY_FORM: ImageModelRow = {
  id: '',
  display_name: '',
  provider: 'huggingface',
  provider_model_id: '',
  credits_per_image: 1.0,
  is_active: true,
  sort_order: 0,
};

async function apiCall(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': ADMIN_SECRET_KEY,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? res.statusText);
  }
  return res.json();
}

export default function AdminImageModelRegistry() {
  const [models, setModels]     = useState<ImageModelRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState<ImageModelRow>(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    apiCall('/image-models')
      .then((data: ImageModelRow[]) => setModels(data))
      .catch(() => setError('Failed to load image models'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (model: ImageModelRow) => {
    setForm(model);
    setEditingId(model.id);
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await apiCall(`/image-models/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            display_name: form.display_name,
            provider: form.provider,
            provider_model_id: form.provider_model_id,
            credits_per_image: form.credits_per_image,
            is_active: form.is_active,
            sort_order: form.sort_order,
          }),
        });
      } else {
        await apiCall('/image-models', { method: 'POST', body: JSON.stringify(form) });
      }
      setShowForm(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (model: ImageModelRow) => {
    try {
      await apiCall(`/image-models/${model.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !model.is_active }),
      });
      load();
    } catch {
      setError('Failed to toggle model');
    }
  };

  const remove = async (model: ImageModelRow) => {
    if (!confirm(`Delete image model "${model.id}"? This can't be undone.`)) return;
    try {
      await apiCall(`/image-models/${model.id}`, { method: 'DELETE' });
      load();
    } catch {
      setError('Failed to delete — it may still be referenced by past generations');
    }
  };

  if (loading) return <div className="h-64 rounded-2xl bg-slate-800/40 animate-pulse" />;

  return (
    <div className="bg-[#0d1224] border border-slate-800 rounded-2xl px-6 py-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest m-0">
          Image Model Registry
        </p>
        <button
          onClick={startCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition-all"
        >
          <Plus size={13} /> Add Model
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-2 mb-4">
        Same pattern as the chat AI models — routing, credit cost, and what shows in the image
        generator's dropdown all read from here.
      </p>

      {error && (
        <div className="text-red-400 text-xs bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 mb-4 grid grid-cols-2 gap-3">
          <Field label="Model ID (stable key)">
            <input
              value={form.id}
              disabled={!!editingId}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              placeholder="e.g. sdxl"
              className="input"
            />
          </Field>
          <Field label="Display Name">
            <input
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              placeholder="e.g. Stable Diffusion 3.5 Large"
              className="input"
            />
          </Field>
          <Field label="Provider">
            <select
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
              className="input"
            >
              {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Provider Model ID">
            <input
              value={form.provider_model_id}
              onChange={(e) => setForm({ ...form, provider_model_id: e.target.value })}
              placeholder="e.g. stabilityai/stable-diffusion-3.5-large"
              className="input"
            />
          </Field>
          <Field label="Credits per Image">
            <input
              type="number" step="0.1" min="0"
              value={form.credits_per_image}
              onChange={(e) => setForm({ ...form, credits_per_image: parseFloat(e.target.value) || 0 })}
              className="input"
            />
          </Field>
          <Field label="Sort Order">
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
              className="input"
            />
          </Field>
          <div className="flex items-end gap-2 col-span-2">
            <button
              onClick={save}
              disabled={saving || !form.id || !form.display_name || !form.provider_model_id}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-xs font-bold transition-all"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {editingId ? 'Update' : 'Create'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 text-xs font-medium hover:border-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[680px]">
          <thead>
            <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-800">
              <th className="py-2 pr-3 font-semibold">Model</th>
              <th className="py-2 pr-3 font-semibold">Provider</th>
              <th className="py-2 pr-3 font-semibold">Credits / Image</th>
              <th className="py-2 pr-3 font-semibold">Status</th>
              <th className="py-2 pr-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {models.map((m) => (
              <tr key={m.id} className="text-sm">
                <td className="py-3 pr-3">
                  <div className="text-slate-200 font-medium">{m.display_name}</div>
                  <div className="text-[10px] text-slate-600 font-mono">{m.id}</div>
                </td>
                <td className="py-3 pr-3 text-slate-400 text-xs">{m.provider}</td>
                <td className="py-3 pr-3 text-slate-300 font-mono text-xs">{m.credits_per_image.toFixed(2)}cr</td>
                <td className="py-3 pr-3">
                  <button
                    onClick={() => toggleActive(m)}
                    className={`flex items-center gap-1.5 text-xs font-medium ${m.is_active ? 'text-emerald-400' : 'text-slate-600'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${m.is_active ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                    {m.is_active ? 'Active' : 'Disabled'}
                  </button>
                </td>
                <td className="py-3 pr-3 text-right">
                  <button onClick={() => startEdit(m)} className="text-indigo-400 hover:text-indigo-300 text-xs font-medium mr-3">
                    Edit
                  </button>
                  <button onClick={() => remove(m)} className="text-red-500 hover:text-red-400 inline-flex">
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .input {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(51, 65, 85, 0.5);
          color: #e2e8f0;
          font-size: 12px;
          padding: 8px 10px;
          border-radius: 8px;
          width: 100%;
        }
        .input:focus { outline: none; border-color: rgba(99, 102, 241, 0.5); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  );
}
