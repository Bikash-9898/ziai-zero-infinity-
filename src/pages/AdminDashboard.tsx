// src/pages/AdminDashboard.tsx
import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, LogOut, PanelRight, X, CreditCard, LayoutDashboardIcon } from 'lucide-react';
import type { AdminUserRow } from '@/types/types';
import UserTable from '@/components/UserTable';
import AdminOverview from '@/components/AdminOverview';
import { useAuth } from '@/context/useAuth';
import LoginForm from '@/components/LoginForm/LoginForm';
import AdminBillingView from '@/components/AdminBillingView';
import { BASE_URL, ADMIN_SECRET_KEY } from '@/config';

const AdminDashboard = () => {
  const { logout, user }                    = useAuth();
  const [activeView, setActiveView]         = useState<string>('overview');
  const [users, setUsers]                   = useState<AdminUserRow[]>([]);
  const [loading, setLoading]               = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [quota, setQuota] = useState<{ used: number; max: number }>({ used: 0, max: 10_000_000 });

  useEffect(() => {
    // /admin/users returns each user enriched with token usage, cost,
    // trial tokens remaining, and wallet balance — powers the Users tab.
    fetch(`${BASE_URL}/admin/users`, {
      headers: { 'X-Admin-Key': ADMIN_SECRET_KEY },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: AdminUserRow[]) => { setUsers(data); setLoading(false); })
      .catch((err) => { console.error('Error fetching users:', err); setLoading(false); });

    fetch(`${BASE_URL}/admin/stats`, {
      headers: { 'X-Admin-Key': ADMIN_SECRET_KEY },
    })
      .then((res) => res.ok ? res.json() : Promise.reject(res.statusText))
      .then((data: { quota_used: number; quota_max: number }) => {
        setQuota({ used: data.quota_used, max: data.quota_max });
      })
      .catch((err) => console.error('Error fetching quota stats:', err));
  }, []);

  // Auth guard — shows login form if no user in context
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0f1e] text-indigo-400 text-lg">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#0a0f1e] text-slate-100 font-sans overflow-hidden">

      {/* Sidebar */}
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
            onClick={logout}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
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

          <div
            className={`lg:hidden fixed inset-0 z-10 bg-black/40 transition-opacity duration-300 ${
              rightPanelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setRightPanelOpen(false)}
          />

          <aside className={`
            shrink-0 w-72 border-l border-slate-800 bg-[#0d1224]/95 backdrop-blur-sm
            p-6 flex flex-col space-y-8
            lg:relative lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto
            fixed right-0 top-0 h-full z-20
            transition-all duration-300 ease-in-out
            ${rightPanelOpen ? 'translate-x-0 opacity-100 shadow-2xl shadow-black/60' : 'translate-x-full opacity-0 pointer-events-none lg:pointer-events-auto'}
          `}>
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
                <StatusItem label="Llama 3.1"  status="Operational" latency="240ms" />
                <StatusItem label="Qwen 2.5"   status="Operational" latency="310ms" />
                <StatusItem label="Mistral 7B" status="High Load"   latency="890ms" color="text-yellow-400" />
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Global Token Usage
              </h3>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500"
                  style={{ width: `${Math.min(100, Math.round((quota.used / (quota.max || 1)) * 100))}%` }}
                />
              </div>
              <p className="mt-2 text-[10px] text-slate-500">
                {formatQuota(quota.used)} / {formatQuota(quota.max)} monthly quota used
              </p>
            </section>
          </aside>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 flex bg-[#0d1224] border-t border-slate-800 z-30">
        <MobileNavItem icon={<LayoutDashboard size={20} />} label="Overview" active={activeView === 'overview'} onClick={() => setActiveView('overview')} />
        <MobileNavItem icon={<Users size={20} />}           label="Users"    active={activeView === 'users'}    onClick={() => setActiveView('users')} />
        <MobileNavItem icon={<CreditCard size={20} />}      label="Billing"  active={activeView === 'billing'}  onClick={() => setActiveView('billing')} />
        {/* navigate('/') removed — auth guard re-shows login form automatically */}
        <MobileNavItem icon={<LogOut size={20} />}          label="Logout"   active={false}                     onClick={logout} />
      </nav>
    </div>
  );
};

function formatQuota(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

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

export default AdminDashboard;
