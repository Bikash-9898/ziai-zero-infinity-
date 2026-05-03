// import { useState } from 'react';
import { useState, useEffect } from 'react';

import { LayoutDashboard, Users, Key, LogOut } from 'lucide-react';
import type { User } from '@/types/types'; // Ensure User is imported/defined
import UserTable from '@/components/UserTable';
import AdminOverview from '@/components/AdminOverview';
// import { useAuth } from '@/context/useAuth';

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState<string>('overview');

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Mock Data
  // const users: User[] = [
  //   { id: '1', username: 'alex_dev', email: 'alex@example.com', plan: 'Premium', createdAt: '2024-01-15', tokenLimit: 100000, tokenUsed: 75000 },
  //   { id: '2', username: 'sarah_j', email: 'sarah@design.io', plan: 'Free', createdAt: '2024-01-16', tokenLimit: 50000, tokenUsed: 48000 },
  // ];

  useEffect(() => {
    // FastAPI default port is 8000
    fetch('http://localhost:8000/users')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data: User[]) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching users from FastAPI:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className='bg-indigo-900'>Loading...</div>;

  return (
    
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-[#0a0f1e] text-slate-100 font-sans">
      
      {/* --- LEFT SIDEBAR --- */}

      <aside className="hidden md:flex w-64 border-r border-slate-800 flex-col bg-[#0d1224]">
        <div className="p-6 text-xl font-bold tracking-tight text-indigo-400">
          AI_CORE Admin
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Overview" 
            active={activeView === 'overview'} 
            onClick={() => setActiveView('overview')} 
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="Users" 
            active={activeView === 'users'} 
            onClick={() => setActiveView('users')} 
          />
          <NavItem 
            icon={<Key size={20} />} 
            label="API Configuration" 
            active={activeView === 'api-keys'} 
            onClick={() => setActiveView('api-keys')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center space-x-3 text-slate-400 hover:text-red-400 transition-colors w-full px-4 py-2">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      
      <main className="flex-1 p-4 md:p-10 overflow-x-hidden overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold capitalize tracking-tight">
            {activeView.replace('-', ' ')}
          </h1>
          <div className="flex items-center space-x-4">
            <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/20">
              System Online
            </div>
          </div>
        </header>

        <div className="max-w-full">
            {activeView === 'users' && <UserTable users={users} />}
            {/* {activeView === 'overview' && <OverviewCards />} */}
            {activeView === 'overview' && <AdminOverview />}
        </div>
      </main>

      {/* --- RIGHT SIDEBAR --- */}
      {/* FIX 4: Changed to hidden on tablets, visible on large screens (lg:flex) */}
      <aside className="hidden lg:flex w-80 border-l border-slate-800 bg-[#0d1224]/50 p-6 flex-col space-y-8">
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6">API Infrastructure</h3>
          <div className="space-y-4">
            <StatusItem label="GPT-4o" status="Operational" latency="240ms" />
            <StatusItem label="Claude 3.5" status="Operational" latency="310ms" />
            <StatusItem label="Vector DB" status="High Load" latency="890ms" color="text-yellow-400" />
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Global Token Usage</h3>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-[65%]" />
          </div>
          <p className="mt-2 text-[10px] text-slate-500">6.5M / 10M monthly quota used</p>
        </section>
      </aside>
    </div>
  );
};

// --- SUB-COMPONENTS (Keep these same but check the Table wrapper) ---

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
};

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

type StatusItemProps = {
  label: string;
  status: string;
  latency: string;
  color?: string;
};

const StatusItem = ({ label, status, latency, color = "text-emerald-400" }: StatusItemProps) => (
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

// const OverviewCards = () => (
//   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//     {[
//       { label: 'Active Requests', value: '1,284', icon: <Activity className="text-indigo-400" /> },
//       { label: 'Total Tokens', value: '45.2M', icon: <Database className="text-indigo-400" /> },
//       { label: 'New Users', value: '+124', icon: <Users className="text-indigo-400" /> },
//     ].map((card, i) => (
//       <div key={i} className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50 hover:border-slate-600 transition-colors">
//         <div className="flex justify-between items-start mb-4">
//           <div className="p-2 bg-slate-900 rounded-xl border border-slate-700">{card.icon}</div>
//         </div>
//         <div className="text-3xl font-bold text-white">{card.value}</div>
//         <div className="text-xs font-medium text-slate-500 uppercase mt-1 tracking-wider">{card.label}</div>
//       </div>
//     ))}
//   </div>
// );


export default AdminDashboard;