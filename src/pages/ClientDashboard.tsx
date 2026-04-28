import { useState } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Sparkles,
  History
} from 'lucide-react';

const ClientDashboard = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'image'>('chat');
  const [input, setInput] = useState('');

  return (
    <div className="flex h-screen bg-[#05070a] text-slate-100 font-sans">
      {/* Sidebar - ZeroInfinity Dark Theme */}
      <aside className="w-64 bg-[#0a0f18] border-r border-slate-800/50 flex flex-col">
        <div className="p-6 border-b border-slate-800/50 flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-linear-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <img 
              src="https://zeroinfinitytechnologies.com/images/logo-1771865164119.webp?t=1777117488383" 
              alt="Logo" 
              className="h-8 w-8 rounded-full"
            />
          </div>
          <span className="font-bold text-xl tracking-tight text-white uppercase">ZI AI</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'chat' 
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.05)]' 
              : 'hover:bg-slate-800/40 text-slate-400'
            }`}
          >
            <MessageSquare size={20} />
            <span className="font-medium">AI Chat Agent</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('image')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'image' 
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.05)]' 
              : 'hover:bg-slate-800/40 text-slate-400'
            }`}
          >
            <ImageIcon size={20} />
            <span className="font-medium">Image Generation</span>
          </button>

          <div className="pt-6 mt-6 border-t border-slate-800/50">
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Recent Activity</p>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-500 hover:text-blue-400 transition-colors group">
              <History size={16} className="group-hover:rotate-[-20deg] transition-transform" />
              <span className="truncate">Cloud Architecture Bot</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800/50 space-y-1 bg-[#0d131f]">
          <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors">
            <Settings size={18} />
            <span className="text-sm font-medium">Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/5 rounded-lg transition-colors">
            <LogOut size={18} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Modern Glass Header */}
        <header className="h-16 bg-[#05070a]/80 backdrop-blur-md border-b border-slate-800/50 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-semibold text-slate-300">
              {activeTab === 'chat' ? 'VIRTUAL ASSISTANT v2.4' : 'IMAGE ENGINE'}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Current Credits</span>
              <span className="text-sm font-mono text-blue-400">842.00 INF</span>
            </div>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-600/20">
              UPGRADE
            </button>
          </div>
        </header>

        {/* Content View */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto w-full">
            {activeTab === 'chat' ? (
              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 border border-blue-400/30">
                    <Sparkles size={18} className="text-white" />
                  </div>
                  <div className="space-y-2">
                    <div className="bg-[#0a0f18] border border-slate-800 p-5 rounded-2xl rounded-tl-none shadow-xl">
                      <p className="text-slate-300 leading-relaxed text-sm">
                        Welcome to ZeroInfinity AI. I am tuned for scalable software architecture and creative engineering. How can I assist you today?
                      </p>
                    </div>
                    {/* <span className="text-[10px] text-slate-600 font-mono">SYSTEM READY // 14:02 PM</span> */}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="group relative aspect-square bg-[#0a0f18] rounded-2xl border border-slate-800 overflow-hidden hover:border-blue-500/50 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <p className="text-xs text-blue-400 font-mono">GEN_REQUISITION_{i}.PNG</p>
                    </div>
                    <div className="h-full w-full flex items-center justify-center">
                       <ImageIcon size={32} className="text-slate-700 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scalable Input Container */}
        <div className="p-8 bg-gradient-to-t from-[#05070a] via-[#05070a] to-transparent">
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-10 group-focus-within:opacity-25 transition-opacity duration-500" />
            <div className="relative flex items-center bg-[#0a0f18] border border-slate-800 rounded-2xl overflow-hidden focus-within:border-blue-500/50 transition-all">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={activeTab === 'chat' ? "Consult with AI..." : "Describe the vision..."}
                className="w-full py-4 pl-6 pr-16 bg-transparent text-white placeholder-slate-600 outline-none"
              />
              <button className="absolute right-3 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-600/20">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;