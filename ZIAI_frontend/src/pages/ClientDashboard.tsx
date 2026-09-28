// src/pages/ClientDashboard.tsx
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ChatProvider } from '@/store/chatStore';
import { ImageProvider } from '@/store/imageStore';
import Sidebar from '@/components/Sidebar';
import { Menu } from 'lucide-react';

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isSettings = location.pathname.startsWith('/client/settings');

  return (
    <div className="flex h-dvh bg-[#212121] text-slate-100 font-sans overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static z-50 h-full transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar — hidden on settings page */}
        {!isSettings && (
          <div className="md:hidden flex items-center px-4 py-3 border-b border-white/5 shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Menu size={22} />
            </button>
          </div>
        )}

        {/* Active page rendered here */}
        <Outlet />
      </main>
    </div>
  );
}

export default function ClientDashboard() {
  return (
    <ChatProvider>
      <ImageProvider>
        <DashboardLayout />
      </ImageProvider>
    </ChatProvider>
  );
}