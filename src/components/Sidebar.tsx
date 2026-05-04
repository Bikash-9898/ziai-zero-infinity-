// src/components/Sidebar.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/useAuth';
import { useChatStore } from '@/store/useChatStore';
import { useImageStore } from '@/store/useImageStore';
import {
  MessageSquare,
  Image as ImageIcon,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Loader2,
  Bot,
  CreditCard,
  Zap,
  X,
  UserRound,
} from 'lucide-react';
import UpgradeModal from './billing/UpgradeModal';

interface SidebarProps {
  activeTab: 'chat' | 'image' | 'settings'; // ← "settings" from v2
  setActiveTab: (tab: 'chat' | 'image' | 'settings') => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const PLAN_COLORS: Record<string, string> = {
  free:       '#64748b',
  basic:      '#06b6d4',
  pro:        '#6366f1',
  enterprise: '#f59e0b',
};

export default function Sidebar({
  activeTab,
  setActiveTab,
  isOpen = true,
  onClose,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);

  // ── v2: derived display values ──────────────────────────
  const displayName  = user?.username || 'Guest';
  const displayEmail = user?.email    || 'Not signed in';
  const userInitial  = displayName.trim().charAt(0).toUpperCase() || 'U';
  const planLabel    = user?.plan || 'Free';
  // ────────────────────────────────────────────────────────

  const planColor  = PLAN_COLORS[user?.plan ?? 'free'] ?? '#64748b';
  const isFreePlan = !user?.plan || user.plan === 'free';

  const {
    conversations,
    loadingConversations,
    fetchConversations,
    activeConversationId,
    loadConversationMessages,
    deleteConv,
    startNewChat,
  } = useChatStore();

  const { history } = useImageStore();

  useEffect(() => {
    if (user?.email) fetchConversations(user.email);
  }, [user?.email, fetchConversations]);

  return (
    <>
      <aside
        className={`
          fixed md:static z-50 h-full
          w-64 max-w-[85vw]
          bg-[#0a0f18] border-r border-slate-800/50
          flex flex-col
          transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo + mobile close button */}
        <div className="p-4 md:p-5 border-b border-slate-800/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <img
                src="https://zeroinfinitytechnologies.com/images/logo-1771865164119.webp?t=1777117488383"
                alt="Logo"
                className="h-7 w-7 rounded-lg"
              />
            </div>
            <span className="font-bold text-base md:text-lg tracking-tight text-white uppercase">ZI AI</span>
          </div>

          {/* Close button (mobile only) — from v2 */}
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Plan badge */}
        <div className="px-3 pt-3">
          <div
            style={{ borderColor: `${planColor}44`, background: `${planColor}0a` }}
            className="flex items-center justify-between px-3 py-2 rounded-xl border"
          >
            <div className="flex items-center gap-2">
              <span style={{ background: planColor }} className="w-1.5 h-1.5 rounded-full" />
              <span style={{ color: planColor }} className="text-[10px] font-bold uppercase tracking-widest">
                {user?.plan ?? 'free'} plan
              </span>
            </div>
            {isFreePlan && (
              <button
                onClick={() => setShowUpgrade(true)}
                style={{ color: planColor }}
                className="text-[10px] font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
              >
                Upgrade
              </button>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
              activeTab === 'chat'
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <MessageSquare size={17} />
            AI Chat Agent
          </button>

          <button
            onClick={() => setActiveTab('image')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
              activeTab === 'image'
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <ImageIcon size={17} />
            Image Generation
          </button>

          {/* Billing nav link */}
          <a
            href="/billing"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
          >
            <CreditCard size={17} />
            Billing & Plans
          </a>
        </nav>

        {/* New Chat button */}
        {activeTab === 'chat' && (
          <div className="px-3 pt-1 pb-2">
            <button
              onClick={startNewChat}
              className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 rounded-xl text-sm font-medium transition-all"
            >
              <Plus size={16} />
              New Chat
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-3 pb-2">
          {activeTab === 'chat' ? (
            <>
              <p className="px-1 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Recent Chats
              </p>
              {loadingConversations ? (
                <div className="flex justify-center py-6">
                  <Loader2 size={18} className="text-slate-600 animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-xs text-slate-600 px-1 py-2">No conversations yet.</p>
              ) : (
                <ul className="space-y-0.5">
                  {conversations.map((conv) => (
                    <li
                      key={conv.id}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                        activeConversationId === conv.id
                          ? 'bg-slate-800/70 text-slate-200'
                          : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-300'
                      }`}
                      onClick={() => {
                        loadConversationMessages(conv.id);
                        onClose?.(); // ← close sidebar on mobile after selecting (from v2)
                      }}
                    >
                      <Bot size={14} className="shrink-0 text-slate-600" />
                      <span className="text-xs truncate flex-1">{conv.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (user?.email) deleteConv(conv.id, user.email);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <p className="px-1 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Recent Images
              </p>
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon size={24} className="text-slate-700 mx-auto mb-2" />
                  <p className="text-[11px] text-slate-600 font-mono">No generations yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {history.slice(0, 12).map(img => (
                    <div
                      key={img.id}
                      className="aspect-square rounded-lg overflow-hidden border border-slate-800/60 hover:border-slate-600 transition-all cursor-pointer"
                      title={img.prompt}
                    >
                      <img src={img.image_url} alt={img.prompt} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Upgrade nudge for free users */}
        {isFreePlan && (
          <div className="px-3 pb-2">
            <button
              onClick={() => setShowUpgrade(true)}
              style={{ borderColor: '#6366f133', background: 'linear-gradient(135deg,#6366f10a,#4f46e50a)' }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all hover:border-indigo-500/30 group"
            >
              <Zap size={15} className="text-indigo-400" />
              <div className="text-left">
                <p className="text-[11px] font-bold text-indigo-400">Upgrade for more</p>
                <p className="text-[10px] text-slate-600">Tokens · Images · Speed</p>
              </div>
            </button>
          </div>
        )}

        {/* Footer — redesigned from v2 (user avatar + name + plan + settings/logout) */}
        <div className="p-3 border-t border-slate-800/50 bg-[#0d131f]">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-200 hover:bg-slate-800/50 transition-colors">

            {/* Avatar */}
            <div className="h-9 w-9 shrink-0 rounded-full bg-slate-700 text-sm font-semibold text-white flex items-center justify-center border border-slate-600/70">
              {user ? userInitial : <UserRound size={18} />}
            </div>

            {/* Name + email — click to open settings */}
            <button
              onClick={() => setActiveTab('settings')}
              className="min-w-0 flex-1 text-left"
              title="Open settings"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium">{displayName}</span>
                <span className="shrink-0 rounded-md bg-slate-700/70 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-300">
                  {planLabel}
                </span>
              </div>
              <p className="truncate text-xs text-slate-500">{displayEmail}</p>
            </button>

            {/* Settings + Logout icon buttons */}
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => setActiveTab('settings')}
                className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-700/70 hover:text-white flex items-center justify-center"
                title="Settings"
                aria-label="Settings"
              >
                <Settings size={16} />
              </button>
              <button
                onClick={logout}
                className="h-8 w-8 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-300 flex items-center justify-center"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Upgrade modal */}
      {showUpgrade && user && (
        <UpgradeModal
          userId={user.id}
          currentPlan={user.plan}
          onClose={() => setShowUpgrade(false)}
          onPlanChanged={() => setShowUpgrade(false)}
        />
      )}
    </>
  );
}
