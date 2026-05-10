// src/pages/ClientDashboard.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/useAuth';
import { useChatStore } from '@/store/useChatStore';
import { ChatProvider } from '@/store/chatStore';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import MessageInput from '@/components/MessageInput';
import ModelSelector from '@/components/ModelSelector';
import { ImageProvider } from '@/store/imageStore';
import ImageTab from '@/components/image/ImageTab';
import { Menu } from 'lucide-react';
import ClientSettings from '@/components/ClientSettings/ClientSettings';

function DashboardLayout() {
  const [activeTab, setActiveTab]   = useState<'chat' | 'image' | 'settings'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user }                    = useAuth();
  const { send, sending }           = useChatStore();

  useEffect(() => {
    const pendingPrompt = sessionStorage.getItem('zi_pending_prompt');
    if (!pendingPrompt || sending) return;

    sessionStorage.removeItem('zi_pending_prompt');
    // No email needed — send only takes the text now
    void send(pendingPrompt);
  }, [send, sending]);

  return (
    <div className="flex h-dvh bg-[#06060c] text-slate-100 font-sans overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed md:static z-50 h-full transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0">
        {activeTab !== 'settings' && (
          <header className="h-14 bg-[#06060c]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-3 sm:px-6 z-10">
            <div className="flex items-center gap-3 min-w-0">
              <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu />
              </button>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <h2 className="text-[10px] sm:text-xs font-semibold text-slate-400 tracking-widest uppercase truncate">
                {activeTab === 'chat' ? 'Virtual Assistant v2.4' : 'Image Engine'}
              </h2>
              {user?.username && (
                <span className="text-xs text-slate-600 hidden lg:block">
                  — {user.username.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {activeTab === 'chat' && (
                <div className="hidden sm:block">
                  <ModelSelector />
                </div>
              )}
            </div>
          </header>
        )}

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {activeTab === 'chat' ? (
            <>
              <div className="flex-1 overflow-hidden">
                <ChatWindow />
              </div>
              <MessageInput />
            </>
          ) : activeTab === 'settings' ? (
            <ClientSettings />
          ) : (
            <div className="flex-1 overflow-auto">
              <ImageTab />
            </div>
          )}
        </div>
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
