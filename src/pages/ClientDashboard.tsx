// src/pages/ClientDashboard.tsx  (replaces your existing file)
import { useState } from 'react';
import { useAuth } from '@/context/useAuth';
import { ChatProvider } from '@/store/chatStore';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import MessageInput from '@/components/MessageInput';
import ModelSelector from '@/components/ModelSelector';
// import { Image as ImageIcon } from 'lucide-react';

import { ImageProvider } from '@/store/imageStore';
import ImageTab from '@/components/image/ImageTab';


// ─── Inner layout (needs access to ChatProvider context) ────────────────────
function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<'chat' | 'image'>('chat');
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-[#05070a] text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">

        {/* Header */}
        <header className="h-14 bg-[#05070a]/80 backdrop-blur-md border-b border-slate-800/50 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-semibold text-slate-400 tracking-widest uppercase">
              {activeTab === 'chat' ? 'Virtual Assistant v2.4' : 'Image Engine'}
            </h2>
            {user?.username && (
              <span className="text-xs text-slate-600 hidden sm:block">
                — {user.username.toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Model selector — only show in chat tab */}
            {activeTab === 'chat' && <ModelSelector />}

            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Credits</span>
              <span className="text-xs font-mono text-blue-400">842.00 INF</span>
            </div>

            <button className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-600/20">
              UPGRADE
            </button>
          </div>
        </header>

        {/* Chat or Image */}
        {activeTab === 'chat' ? (
          <>
            <ChatWindow />
            <MessageInput />
          </>
        ) : (
          <ImageTab />
        )}
      </main>
    </div>
  );
}

// ─── Root export wraps layout with ChatProvider ──────────────────────────────
export default function ClientDashboard() {
  return (
    <ChatProvider>
      <ImageProvider>
        <DashboardLayout />
      </ImageProvider>
    </ChatProvider>
  );
}
