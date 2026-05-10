// src/components/ClientSettings/ClientSettings.tsx
import { useState } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import { apiFetch } from '@/api/apiClient';

const ClientSettings = () => {
  const { user, setUser }                       = useAuth();
  const [username, setUsername]                 = useState(user?.username ?? '');
  const [saving, setSaving]                     = useState(false);
  const [saved, setSaved]                       = useState(false);
  const [error, setError]                       = useState<string | null>(null);

  const handleSave = async () => {
    if (!username.trim()) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res  = await apiFetch('/users/me', {
        method: 'PATCH',
        body:   JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      // Update local auth state so navbar/sidebar reflect the change immediately
      if (user) setUser({ ...user, username: data.username });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6 bg-[#06060c] min-h-full">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-bold mb-6 bg-clip-text text-transparent bg-linear-to-r from-white to-purple-400">
          Settings
        </h2>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-2">
              <div className="bg-linear-to-br from-purple-600 to-blue-500 rounded-md w-16 h-16 flex items-center justify-center text-2xl font-bold text-white">
                {user?.username?.[0]?.toUpperCase() ?? 'U'}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">User Profile</h3>
              <p className="text-gray-400 text-sm">Manage your account settings</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-600 mt-1">Email is managed by Google and cannot be changed here.</p>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !username.trim()}
              className="flex items-center gap-2 bg-linear-to-r from-purple-600 to-blue-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
            >
              {saving ? (
                <><Loader2 size={14} className="animate-spin" /> Saving…</>
              ) : saved ? (
                <><CheckCircle size={14} /> Saved!</>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSettings;
