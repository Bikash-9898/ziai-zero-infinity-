// src/components/AdminBillingView.tsx
import { useState, useEffect } from 'react';
import { BASE_URL, ADMIN_KEY } from '@/config';

// const API = 'http://localhost:8000';
// const ADMIN_KEY = 'supersecretadminkey';

const PLAN_COLORS: Record<string, string> = {
  free: '#64748b', basic: '#06b6d4', pro: '#6366f1', enterprise: '#f59e0b',
};

// ── Types ─────────────────────────────────────────────────────
interface PaymentRecord {
  id: string;
  user_id: string;
  provider: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  transaction_id: string | null;
  verified_at: string | null;
  created_at: string;
}

interface BillingStats {
  total_revenue: number;
  active_subscriptions: number;
  plan_distribution: Record<string, number>;
  recent_payments: PaymentRecord[];
}

// ── Sub-components ────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-[#0d1224] border border-slate-800 rounded-xl px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 mt-0">{label}</p>
      <p className="text-[22px] font-black tracking-[-0.03em] tabular-nums mb-0.5 mt-0" style={{ color }}>{value}</p>
      <p className="text-[11px] text-slate-700 m-0">{sub}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    success:  'bg-green-500/10 text-green-500',
    pending:  'bg-amber-500/10 text-amber-500',
    failed:   'bg-red-500/10 text-red-500',
    refunded: 'bg-indigo-500/10 text-indigo-500',
  };
  const cls = colors[status] ?? 'bg-slate-700/10 text-slate-500';
  return (
    <span className={`text-[10px] font-bold uppercase tracking-[0.06em] px-2 py-0.75 rounded-full ${cls}`}>
      {status}
    </span>
  );
}

function Skeleton({ height = 60 }: { height?: number }) {
  return (
    <>
      <div
        className="rounded-[10px] bg-linear-to-r from-[#0d1224] via-slate-800 to-[#0d1224] bg-size-[200%_100%] animate-[shimmer_1.5s_infinite]"
        style={{ height }}
      />
      <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>
    </>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function AdminBillingView() {
  const [stats, setStats]     = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/admin/billing/stats`, {
      headers: { 'X-Admin-Key': ADMIN_KEY },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setStats)
      .catch(() => setError('Failed to load billing data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map(i => <Skeleton key={i} height={80} />)}
    </div>
  );

  if (error) return (
    <div className="text-red-500 bg-red-500/5 border border-red-500/20 rounded-[10px] px-4.5 py-3.5 text-[13px]">
      {error} — check that <code>/api/admin/billing/stats</code> is implemented.
    </div>
  );

  const data: BillingStats = stats ?? {
    total_revenue: 0,
    active_subscriptions: 0,
    plan_distribution: { free: 0, basic: 0, pro: 0, enterprise: 0 },
    recent_payments: [],
  };

  const totalUsers = Object.values(data.plan_distribution).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="flex flex-col gap-6">

      {/* Revenue summary */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
        <StatCard label="Total Revenue"        value={`NPR ${data.total_revenue.toLocaleString()}`}   sub="all time"     color="#6366f1" />
        <StatCard label="Active Subscriptions" value={String(data.active_subscriptions)}              sub="paying users" color="#06b6d4" />
        <StatCard label="Total Users"          value={String(totalUsers)}                             sub="registered"   color="#64748b" />
        <StatCard label="Enterprise"           value={String(data.plan_distribution.enterprise ?? 0)} sub="highest tier" color="#f59e0b" />
      </div>

      {/* Plan distribution */}
      <div className="bg-[#0d1224] border border-slate-800 rounded-2xl px-6 py-5">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4.5 mt-0">
          Plan Distribution
        </p>
        <div className="flex flex-col gap-3.5">
          {(['enterprise', 'pro', 'basic', 'free'] as const).map(plan => {
            const count = data.plan_distribution[plan] ?? 0;
            const pct   = Math.round((count / totalUsers) * 100);
            const color = PLAN_COLORS[plan];
            return (
              <div key={plan} className="flex items-center gap-3">
                <span className="w-18 text-xs font-semibold capitalize" style={{ color }}>{plan}</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-600 ease-in-out"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color}cc,${color})` }}
                  />
                </div>
                <span className="text-xs text-slate-500 font-mono w-14 text-right shrink-0">
                  {count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent payments */}
      <div className="bg-[#0d1224] border border-slate-800 rounded-2xl px-6 py-5">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4.5 mt-0">
          Recent Payments
        </p>
        {data.recent_payments.length === 0 ? (
          <p className="text-[13px] text-slate-700">No payment records yet.</p>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {['Date', 'Plan', 'Amount', 'Provider', 'Status'].map(h => (
                  <th
                    key={h}
                    className="text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-700 pb-2.5 border-b border-slate-800"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recent_payments.map(p => (
                <tr key={p.id}>
                  <td className="py-2.5 border-b border-[#0f172a] text-slate-500 font-mono text-[11px]">
                    {new Date(p.created_at).toLocaleDateString('en-NP')}
                  </td>
                  <td className="py-2.5 border-b border-[#0f172a]">
                    <span className="font-semibold capitalize" style={{ color: PLAN_COLORS[p.plan] ?? '#64748b' }}>
                      {p.plan}
                    </span>
                  </td>
                  <td className="py-2.5 border-b border-[#0f172a] text-slate-400 font-mono">
                    NPR {Number(p.amount).toLocaleString()}
                  </td>
                  <td className="py-2.5 border-b border-[#0f172a] text-slate-500 capitalize">
                    {p.provider}
                  </td>
                  <td className="py-2.5 border-b border-[#0f172a]">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}