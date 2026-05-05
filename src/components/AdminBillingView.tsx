// src/components/AdminBillingView.tsx
import { useState, useEffect } from 'react';

const API = 'http://localhost:8000';
const ADMIN_KEY = 'supersecretadminkey';

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
    <div style={{ background: '#0d1224', border: '1px solid #1e293b', borderRadius: 12, padding: '16px 20px' }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: '-0.03em', margin: '0 0 2px', fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      <p style={{ fontSize: 11, color: '#334155', margin: 0 }}>{sub}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, [string, string]> = {
    success:  ['#22c55e22', '#22c55e'],
    pending:  ['#f59e0b22', '#f59e0b'],
    failed:   ['#ef444422', '#ef4444'],
    refunded: ['#6366f122', '#6366f1'],
  };
  const [bg, fg] = colors[status] ?? ['#33415522', '#64748b'];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 999, background: bg, color: fg }}>
      {status}
    </span>
  );
}

function Skeleton({ height = 60 }: { height?: number }) {
  return (
    <div style={{ height, background: 'linear-gradient(90deg,#0d1224,#1e293b,#0d1224)', backgroundSize: '200% 100%', borderRadius: 10, animation: 'shimmer 1.5s infinite' }}>
      <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function AdminBillingView() {
  const [stats, setStats]     = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/admin/billing/stats`, {
      headers: { 'X-Admin-Key': ADMIN_KEY },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setStats)
      .catch(() => setError('Failed to load billing data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1, 2, 3].map(i => <Skeleton key={i} height={80} />)}
    </div>
  );

  if (error) return (
    <div style={{ color: '#ef4444', background: '#ef444411', border: '1px solid #ef444433', borderRadius: 10, padding: '14px 18px', fontSize: 13 }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Revenue summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <StatCard label="Total Revenue"        value={`NPR ${data.total_revenue.toLocaleString()}`}   sub="all time"     color="#6366f1" />
        <StatCard label="Active Subscriptions" value={String(data.active_subscriptions)}              sub="paying users" color="#06b6d4" />
        <StatCard label="Total Users"          value={String(totalUsers)}                             sub="registered"   color="#64748b" />
        <StatCard label="Enterprise"           value={String(data.plan_distribution.enterprise ?? 0)} sub="highest tier" color="#f59e0b" />
      </div>

      {/* Plan distribution */}
      <div style={{ background: '#0d1224', border: '1px solid #1e293b', borderRadius: 14, padding: '20px 24px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 18px' }}>
          Plan Distribution
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(['enterprise', 'pro', 'basic', 'free'] as const).map(plan => {
            const count = data.plan_distribution[plan] ?? 0;
            const pct   = Math.round((count / totalUsers) * 100);
            const color = PLAN_COLORS[plan];
            return (
              <div key={plan} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 72, fontSize: 12, fontWeight: 600, color, textTransform: 'capitalize' }}>{plan}</span>
                <div style={{ flex: 1, height: 8, background: '#1e293b', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${color}cc,${color})`, borderRadius: 999, transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace', width: 56, textAlign: 'right' }}>
                  {count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent payments */}
      <div style={{ background: '#0d1224', border: '1px solid #1e293b', borderRadius: 14, padding: '20px 24px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 18px' }}>
          Recent Payments
        </p>
        {data.recent_payments.length === 0 ? (
          <p style={{ fontSize: 13, color: '#334155' }}>No payment records yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Date', 'Plan', 'Amount', 'Provider', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#334155', paddingBottom: 10, borderBottom: '1px solid #1e293b' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recent_payments.map(p => (
                <tr key={p.id}>
                  <td style={{ padding: '10px 0', borderBottom: '1px solid #0f172a', color: '#475569', fontFamily: 'monospace', fontSize: 11 }}>
                    {new Date(p.created_at).toLocaleDateString('en-NP')}
                  </td>
                  <td style={{ padding: '10px 0', borderBottom: '1px solid #0f172a' }}>
                    <span style={{ color: PLAN_COLORS[p.plan] ?? '#64748b', fontWeight: 600, textTransform: 'capitalize' }}>{p.plan}</span>
                  </td>
                  <td style={{ padding: '10px 0', borderBottom: '1px solid #0f172a', color: '#94a3b8', fontFamily: 'monospace' }}>
                    NPR {Number(p.amount).toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 0', borderBottom: '1px solid #0f172a', color: '#64748b', textTransform: 'capitalize' }}>
                    {p.provider}
                  </td>
                  <td style={{ padding: '10px 0', borderBottom: '1px solid #0f172a' }}>
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
