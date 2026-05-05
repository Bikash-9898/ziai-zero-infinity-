// src/pages/AdminDashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, PanelRight, X, CreditCard, LayoutDashboardIcon } from 'lucide-react';
import type { User } from '@/types/types';
import UserTable from '@/components/UserTable';
import AdminOverview from '@/components/AdminOverview';
import { useAuth } from '@/context/useAuth';
import LoginForm from '@/components/LoginForm';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
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

const API ='http://localhost:8000';
const ADMIN_KEY= "supersecretadminkey"
// console.log('API URL:', API);

const PLAN_COLORS: Record<string, string> = {
  free: '#64748b', basic: '#06b6d4', pro: '#6366f1', enterprise: '#f59e0b',
};

// ─────────────────────────────────────────────────────────────
// Admin Billing View
// ─────────────────────────────────────────────────────────────
function AdminBillingView() {
  const [stats, setStats]     = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/admin/billing/stats`, {
      headers: {
        'X-Admin-Key': ADMIN_KEY, // ← simple auth for demo purposes; replace with real auth in production
      },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setStats)
      .catch(() => setError('Failed to load billing data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1,2,3].map(i => <Skeleton key={i} height={80} />)}
    </div>
  );

  if (error) return (
    <div style={{ color: '#ef4444', background: '#ef444411', border: '1px solid #ef444433', borderRadius: 10, padding: '14px 18px', fontSize: 13 }}>
      {error} — check that <code>/api/admin/billing/stats</code> is implemented.
    </div>
  );

  const demo: BillingStats = stats ?? {
    total_revenue: 0,
    active_subscriptions: 0,
    plan_distribution: { free: 0, basic: 0, pro: 0, enterprise: 0 },
    recent_payments: [],
  };

  const totalUsers = Object.values(demo.plan_distribution).reduce((a, b) => a + b, 0) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Revenue summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <StatCard label="Total Revenue"         value={`NPR ${demo.total_revenue.toLocaleString()}`}       sub="all time"     color="#6366f1" />
        <StatCard label="Active Subscriptions"  value={String(demo.active_subscriptions)}                  sub="paying users" color="#06b6d4" />
        <StatCard label="Total Users"           value={String(totalUsers)}                                 sub="registered"   color="#64748b" />
        <StatCard label="Enterprise"            value={String(demo.plan_distribution.enterprise ?? 0)}     sub="highest tier" color="#f59e0b" />
      </div>

      {/* Plan distribution */}
      <div style={{ background: '#0d1224', border: '1px solid #1e293b', borderRadius: 14, padding: '20px 24px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 18px' }}>
          Plan Distribution
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(['enterprise', 'pro', 'basic', 'free'] as const).map(plan => {
            const count = demo.plan_distribution[plan] ?? 0;
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

      {/* Recent payments table */}
      <div style={{ background: '#0d1224', border: '1px solid #1e293b', borderRadius: 14, padding: '20px 24px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 18px' }}>
          Recent Payments
        </p>
        {demo.recent_payments.length === 0 ? (
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
              {demo.recent_payments.map(p => (
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

      {/* Note about backend endpoint */}
      <div style={{ background: '#f59e0b0a', border: '1px solid #f59e0b22', borderRadius: 10, padding: '12px 16px' }}>
        <p style={{ fontSize: 12, color: '#f59e0b99', margin: 0 }}>
          <strong style={{ color: '#f59e0b' }}>Backend needed:</strong> Add{' '}
          <code style={{ background: '#1e293b', padding: '1px 6px', borderRadius: 4 }}>GET /api/admin/billing/stats</code>{' '}
          returning <code style={{ background: '#1e293b', padding: '1px 6px', borderRadius: 4 }}>total_revenue</code>,{' '}
          <code style={{ background: '#1e293b', padding: '1px 6px', borderRadius: 4 }}>active_subscriptions</code>,{' '}
          <code style={{ background: '#1e293b', padding: '1px 6px', borderRadius: 4 }}>plan_distribution</code>, and{' '}
          <code style={{ background: '#1e293b', padding: '1px 6px', borderRadius: 4 }}>recent_payments</code>.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main AdminDashboard
// ─────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { logout, user } = useAuth();                          // ← from v2
  const navigate = useNavigate();                              // ← from v2
  const [activeView, setActiveView]         = useState<string>('overview');
  const [users, setUsers]                   = useState<User[]>([]);
  const [loading, setLoading]               = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  useEffect(() => {
    fetch(`${API}/users`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data: User[]) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching users from FastAPI:', err);
        setLoading(false);
      });
  }, []);

  // ── Auth guard (from v2) ──────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
              <LayoutDashboardIcon size={24} className="text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">AI_CORE Admin</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to access the dashboard</p>
          </div>
          <LoginForm />
        </div>
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0f1e] text-indigo-400 text-lg">
        Loading...
      </div>
    );

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#0a0f1e] text-slate-100 font-sans overflow-hidden">

      {/* LEFT SIDEBAR */}
      <aside className="hidden md:flex w-64 border-r border-slate-800 flex-col bg-[#0d1224] shrink-0">
        <div className="p-6 text-xl font-bold tracking-tight text-indigo-400">
          AI_CORE Admin
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Overview" active={activeView === 'overview'} onClick={() => setActiveView('overview')} />
          <NavItem icon={<Users size={20} />}           label="Users"    active={activeView === 'users'}    onClick={() => setActiveView('users')} />
          <NavItem icon={<CreditCard size={20} />}      label="Billing"  active={activeView === 'billing'}  onClick={() => setActiveView('billing')} />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button
            className="flex items-center space-x-3 text-slate-400 hover:text-red-400 transition-colors w-full px-4 py-2"
            onClick={logout}                                   // ← wired up from v2
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="shrink-0 px-4 md:px-10 pt-4 md:pt-8 pb-4 flex justify-between items-center">
          <h1 className="text-xl md:text-3xl font-bold capitalize tracking-tight">
            {activeView === 'billing' ? 'Billing Dashboard' : activeView.replace('-', ' ')}
          </h1>
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/20 hidden sm:block">
              System Online
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 sm:hidden" title="System Online" />
            <button
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors"
              onClick={() => setRightPanelOpen((v) => !v)}
              aria-label="Toggle API status panel"
            >
              <PanelRight size={20} />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 md:px-10 pb-24 md:pb-10">
            {activeView === 'users'    && <UserTable users={users} />}
            {activeView === 'overview' && <AdminOverview />}
            {activeView === 'billing'  && <AdminBillingView />}
          </div>

          {/* Backdrop for right panel */}
          <div
            className={`lg:hidden fixed inset-0 z-10 bg-black/40 transition-opacity duration-300 ${
              rightPanelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setRightPanelOpen(false)}
          />

          {/* RIGHT SIDEBAR */}
          <aside
            className={`
              shrink-0 w-72 border-l border-slate-800 bg-[#0d1224]/95 backdrop-blur-sm
              p-6 flex flex-col space-y-8
              lg:relative lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto
              fixed right-0 top-0 h-full z-20
              transition-all duration-300 ease-in-out
              ${rightPanelOpen ? 'translate-x-0 opacity-100 shadow-2xl shadow-black/60' : 'translate-x-full opacity-0 pointer-events-none lg:pointer-events-auto'}
            `}
          >
            <button
              className="lg:hidden self-end -mt-2 -mr-2 p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              onClick={() => setRightPanelOpen(false)}
              aria-label="Close panel"
            >
              <X size={16} />
            </button>

            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6">
                API Infrastructure
              </h3>
              <div className="space-y-4">
                <StatusItem label="GPT-4o"     status="Operational" latency="240ms" />
                <StatusItem label="Claude 3.5" status="Operational" latency="310ms" />
                <StatusItem label="Vector DB"  status="High Load"   latency="890ms" color="text-yellow-400" />
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Global Token Usage
              </h3>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[65%]" />
              </div>
              <p className="mt-2 text-[10px] text-slate-500">6.5M / 10M monthly quota used</p>
            </section>
          </aside>
        </div>
      </main>

      {/* BOTTOM NAV (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 flex bg-[#0d1224] border-t border-slate-800 z-30">
        <MobileNavItem icon={<LayoutDashboard size={20} />} label="Overview" active={activeView === 'overview'} onClick={() => setActiveView('overview')} />
        <MobileNavItem icon={<Users size={20} />}           label="Users"    active={activeView === 'users'}    onClick={() => setActiveView('users')} />
        <MobileNavItem icon={<CreditCard size={20} />}      label="Billing"  active={activeView === 'billing'}  onClick={() => setActiveView('billing')} />
        <MobileNavItem icon={<LogOut size={20} />}          label="Logout"   active={false}                     onClick={() => { logout(); navigate('/'); }} />
      </nav>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────
type NavItemProps = { icon: React.ReactNode; label: string; active: boolean; onClick: () => void };

const NavItem = ({ icon, label, active, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
      active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

const MobileNavItem = ({ icon, label, active, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] transition-colors ${
      active ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

type StatusItemProps = { label: string; status: string; latency: string; color?: string };

const StatusItem = ({ label, status, latency, color = 'text-emerald-400' }: StatusItemProps) => (
  <div className="flex justify-between items-center text-sm">
    <div className="flex items-center space-x-3 text-slate-300">
      <div className={`w-1.5 h-1.5 rounded-full ${color.replace('text', 'bg')}`} />
      <span className="text-slate-400">{label}</span>
    </div>
    <div className="text-right">
      <div className={`text-[10px] font-bold uppercase tracking-tighter ${color}`}>{status}</div>
      <div className="text-[10px] text-slate-600">{latency}</div>
    </div>
  </div>
);

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

export default AdminDashboard;
