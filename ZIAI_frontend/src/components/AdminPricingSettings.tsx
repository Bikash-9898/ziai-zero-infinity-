// src/components/AdminPricingSettings.tsx
import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { BASE_URL, ADMIN_SECRET_KEY } from '@/config';

interface PricingSettings {
  usd_to_npr_rate: number;
  free_trial_tokens: number;
  guest_trial_tokens: number;
}

export default function AdminPricingSettings() {
  const [data, setData]       = useState<PricingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/admin/settings/pricing`, {
      headers: { 'X-Admin-Key': ADMIN_SECRET_KEY },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((res: PricingSettings) => setData(res))
      .catch(() => setError('Failed to load pricing settings'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/settings/pricing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': ADMIN_SECRET_KEY,
        },
        body: JSON.stringify(data),
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
  if (!data) return null;

  return (
    <div className="bg-[#0d1224] border border-slate-800 rounded-2xl px-6 py-5">
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest m-0">
        Pricing & Trial Settings
      </p>
      <p className="text-xs text-slate-500 mt-2 mb-4">
        These affect every user going forward — existing wallet balances and trial grants already
        given out aren't retroactively changed.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <Field label="USD → NPR Rate" hint="Used to convert model cost (USD) into wallet deductions (NPR).">
          <input
            type="number" step="0.01" min="0"
            value={data.usd_to_npr_rate}
            onChange={(e) => setData({ ...data, usd_to_npr_rate: parseFloat(e.target.value) || 0 })}
            className="input"
          />
        </Field>
        <Field label="Signed-up Trial (tokens)" hint="Free tokens granted to a real account on signup.">
          <input
            type="number" min="0"
            value={data.free_trial_tokens}
            onChange={(e) => setData({ ...data, free_trial_tokens: parseInt(e.target.value) || 0 })}
            className="input"
          />
        </Field>
        <Field label="Guest Trial (tokens)" hint="Free tokens for not-signed-in visitors, per browser.">
          <input
            type="number" min="0"
            value={data.guest_trial_tokens}
            onChange={(e) => setData({ ...data, guest_trial_tokens: parseInt(e.target.value) || 0 })}
            className="input"
          />
        </Field>
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
        {error && <span className="text-red-400 text-xs">{error}</span>}
      </div>

      <style>{`
        .input {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(51, 65, 85, 0.5);
          color: #e2e8f0;
          font-size: 13px;
          padding: 9px 11px;
          border-radius: 8px;
          width: 100%;
        }
        .input:focus { outline: none; border-color: rgba(99, 102, 241, 0.5); }
      `}</style>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
      <p className="text-[10px] text-slate-600 mt-1">{hint}</p>
    </div>
  );
}
