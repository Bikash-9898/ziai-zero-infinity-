import { useState } from "react";
import { useAuth } from "@/context/useAuth";
import { ChatProvider } from "@/store/chatStore";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import MessageInput from "@/components/MessageInput";
import ModelSelector from "@/components/ModelSelector";
import { ImageProvider } from "@/store/imageStore";
import ImageTab from "@/components/image/ImageTab";
import { Menu } from "lucide-react";
import ClientSettings from "@/components/ClientSetting/ClientSettings"; // ← from v2

function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<"chat" | "image" | "settings">("chat"); // ← "settings" added from v2
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-dvh bg-[#05070a] text-slate-100 font-sans overflow-hidden">

      {/* Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed md:static z-50 h-full transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="h-14 bg-[#05070a]/80 backdrop-blur-md border-b border-slate-800/50 flex items-center justify-between px-3 sm:px-6 z-10">

          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">

            {/* Mobile menu button */}
            <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu />
            </button>

            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />

            <h2 className="text-[10px] sm:text-xs font-semibold text-slate-400 tracking-widest uppercase truncate">
              {activeTab === "chat" ? "Virtual Assistant v2.4" : "Image Engine"}
            </h2>

            {user?.username && (
              <span className="text-xs text-slate-600 hidden lg:block">
                — {user.username.toUpperCase()}
              </span>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 sm:gap-4">

            {activeTab === "chat" && (
              <div className="hidden sm:block">
                <ModelSelector />
              </div>
            )}

            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">
                Credits
              </span>
              <span className="text-xs font-mono text-blue-400">
                842.00 INF
              </span>
            </div>

            <button className="bg-blue-600 hover:bg-blue-500 text-white px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all shadow-lg shadow-blue-600/20">
              UPGRADE
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

          {activeTab === "chat" ? (
            <>
              <div className="flex-1 overflow-hidden">
                <ChatWindow />
              </div>
              <MessageInput />
            </>
          ) : activeTab === "settings" ? (    // ← settings branch from v2
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
