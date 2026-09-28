// src/components/AdminApiKeyDatabase.tsx
import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, Loader2, Eye, EyeOff, Copy, Check, Key, Database, RefreshCw, Search } from 'lucide-react';
import { BASE_URL, ADMIN_SECRET_KEY } from '@/config';

export interface ApiKeyRow {
  id: string;
  name: string;
  provider: string;
  key_value: string;
  is_active: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

const PROVIDERS = [
  { id: 'huggingface', label: 'HuggingFace', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  { id: 'openai', label: 'OpenAI', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { id: 'anthropic', label: 'Anthropic', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { id: 'fal', label: 'fal.ai', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { id: 'tavily', label: 'Tavily Search', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { id: 'google', label: 'Google Gemini', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  { id: 'nvidia', label: 'NVIDIA NIM', color: 'bg-lime-500/10 text-lime-400 border-lime-500/20' },
  { id: 'openrouter', label: 'OpenRouter', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { id: 'other', label: 'Custom Provider', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
];

const EMPTY_FORM: ApiKeyRow = {
  id: '',
  name: '',
  provider: 'huggingface',
  key_value: '',
  is_active: true,
  description: '',
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

function maskKey(key: string): string {
  if (!key) return '—';
  if (key.length <= 8) return '••••••••';
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

export default function AdminApiKeyDatabase() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ApiKeyRow>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    apiCall('/api-keys')
      .then((data: ApiKeyRow[]) => setKeys(data))
      .catch((err) => setError(err.message || 'Failed to load API keys'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      showToast('API key copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast('Failed to copy');
    }
  };

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (keyItem: ApiKeyRow) => {
    setForm(keyItem);
    setEditingId(keyItem.id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.key_value.trim()) {
      setError('Please provide key name and value');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await apiCall(`/api-keys/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: form.name,
            provider: form.provider,
            key_value: form.key_value,
            is_active: form.is_active,
            description: form.description,
          }),
        });
        showToast('API Key updated successfully');
      } else {
        await apiCall('/api-keys', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        showToast('API Key created successfully');
      }
      setShowForm(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (keyItem: ApiKeyRow) => {
    try {
      await apiCall(`/api-keys/${keyItem.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !keyItem.is_active }),
      });
      load();
    } catch {
      setError('Failed to toggle status');
    }
  };

  const remove = async (keyItem: ApiKeyRow) => {
    if (!confirm(`Are you sure you want to delete "${keyItem.name}"? This cannot be undone.`)) return;
    try {
      await apiCall(`/api-keys/${keyItem.id}`, { method: 'DELETE' });
      showToast(`Deleted ${keyItem.name}`);
      load();
    } catch {
      setError('Failed to delete API Key');
    }
  };

  const filteredKeys = keys.filter(k => {
    const matchesSearch = k.name.toLowerCase().includes(search.toLowerCase()) || 
                          k.provider.toLowerCase().includes(search.toLowerCase()) ||
                          (k.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesProvider = providerFilter === 'all' || k.provider === providerFilter;
    return matchesSearch && matchesProvider;
  });

  const activeCount = keys.filter(k => k.is_active).length;

  if (loading) return <div className="h-64 rounded-2xl bg-slate-800/40 animate-pulse flex items-center justify-center text-slate-500 text-sm">Loading Database API Keys...</div>;

  return (
    <div className="bg-[#0d1224] border border-slate-800 rounded-2xl px-6 py-6 shadow-xl">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Database size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">API Keys Database</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Store, update, and manage platform API keys in the central database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono">
            <span>Keys: <strong className="text-slate-200">{keys.length}</strong></span>
            <span className="text-slate-700">|</span>
            <span>Active: <strong className="text-emerald-400">{activeCount}</strong></span>
          </div>

          <button
            onClick={load}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="Refresh database"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={startCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus size={15} /> Add API Key
          </button>
        </div>
      </div>

      {/* Notifications */}
      {toastMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs px-4 py-2.5 rounded-xl mb-4 flex items-center justify-between">
          <span>{toastMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl mb-4">
          {error}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search API keys by name or provider..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-indigo-500 transition-colors shrink-0"
        >
          <option value="all">All Providers</option>
          {PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Form Modal / Inline Editor */}
      {showForm && (
        <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 mb-6 shadow-2xl">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">
            {editingId ? 'Edit API Key' : 'Create New API Key'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Key Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. HuggingFace Primary Key"
                className="w-full bg-[#0a0f1e] border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Provider</label>
              <select
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                className="w-full bg-[#0a0f1e] border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition-colors"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">API Key Secret Value</label>
              <div className="relative">
                <input
                  type="text"
                  value={form.key_value}
                  onChange={(e) => setForm({ ...form, key_value: e.target.value })}
                  placeholder="e.g. hf_xxxxxxxxxxxxxxxx..."
                  className="w-full bg-[#0a0f1e] border border-slate-700/60 rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-mono text-emerald-400 placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors"
                />
                <Key size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Description / Notes (Optional)</label>
              <input
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Used for high-speed model inference"
                className="w-full bg-[#0a0f1e] border border-slate-700/60 rounded-xl px-3.5 py-2 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-slate-300">Status:</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, is_active: !form.is_active })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  form.is_active 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                    : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}
              >
                {form.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 mt-5 pt-4 border-t border-slate-800">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || !form.name.trim() || !form.key_value.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {editingId ? 'Update Key' : 'Save Key'}
            </button>
          </div>
        </div>
      )}

      {/* Database Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-200">
          <thead>
            <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-800/80">
              <th className="py-3 px-3 font-semibold">Key Name & Details</th>
              <th className="py-3 px-3 font-semibold">Provider</th>
              <th className="py-3 px-3 font-semibold">API Key Value</th>
              <th className="py-3 px-3 font-semibold">Status</th>
              <th className="py-3 px-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {filteredKeys.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                  No API keys found in database matching criteria.
                </td>
              </tr>
            ) : (
              filteredKeys.map((k) => {
                const provObj = PROVIDERS.find(p => p.id === k.provider) || { label: k.provider, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
                const isVisible = !!visibleKeys[k.id];
                const isCopied = copiedId === k.id;

                return (
                  <tr key={k.id} className="hover:bg-slate-900/40 transition-colors text-sm group">
                    <td className="py-3.5 px-3">
                      <div className="text-slate-100 font-semibold flex items-center gap-2">
                        <span>{k.name}</span>
                      </div>
                      {k.description && (
                        <div className="text-xs text-slate-500 mt-0.5 max-w-sm truncate">{k.description}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${provObj.color}`}>
                        {provObj.label}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
                        <span className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800/80 max-w-64 truncate">
                          {isVisible ? k.key_value : maskKey(k.key_value)}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleVisibility(k.id)}
                          className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          title={isVisible ? 'Hide key' : 'Show key'}
                        >
                          {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => void copyToClipboard(k.id, k.key_value)}
                          className="p-1 rounded-md text-slate-500 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                          title="Copy API key"
                        >
                          {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <button
                        type="button"
                        onClick={() => void toggleActive(k)}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                          k.is_active 
                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                            : 'bg-slate-800/60 text-slate-500 hover:bg-slate-800'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${k.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                        {k.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(k)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(k)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete API key"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
