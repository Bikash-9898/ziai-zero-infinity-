// src/components/Sidebar.tsx
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/useAuth';
import { useChatStore } from '@/store/useChatStore';
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
  CircleArrowUp,
} from 'lucide-react';
import UpgradeModal from './billing/UpgradeModal';
import { Link } from 'react-router-dom';
import { ImageSidebarHistory } from './image/ImageSidebarHistory';

interface SidebarProps {
  activeTab:    'chat' | 'image' | 'settings';
  setActiveTab: (tab: 'chat' | 'image' | 'settings') => void;
  isOpen?:      boolean;
  onClose?:     () => void;
}

const PLAN_COLORS: Record<string, string> = {
  free:       '#64748b',
  basic:      '#06b6d4',
  pro:        '#6366f1',
  enterprise: '#f59e0b',
};

export default function Sidebar({ activeTab, setActiveTab, isOpen = true, onClose }: SidebarProps) {
  const { user, logout }                                = useAuth();
  const [showUpgrade, setShowUpgrade]                   = useState(false);
  const [accountMenuOpen, setAccountMenuOpen]           = useState(false);
  const accountMenuRef                                  = useRef<HTMLDivElement>(null);

  const displayName  = user?.username || 'Guest';
  const displayEmail = user?.email    || 'Not signed in';
  const userInitial  = displayName.trim().charAt(0).toUpperCase() || 'U';
  const planLabel    = user?.plan ?? 'Free';
  const planColor    = PLAN_COLORS[user?.plan ?? 'free'] ?? '#64748b';
  const isFreePlan   = !user?.plan || user.plan === 'free';

  const {
    conversations,
    loadingConversations,
    fetchConversations,
    activeConversationId,
    loadConversationMessages,
    deleteConv,
    startNewChat,
  } = useChatStore();

  // Fetch on mount — no email needed anymore
  useEffect(() => {
    if (user?.email) fetchConversations();
  }, [user?.email, fetchConversations]);

  // Click-outside / Escape to close account menu
  useEffect(() => {
    if (!accountMenuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAccountMenuOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountMenuOpen]);

  const openSettings = () => { setActiveTab('settings'); setAccountMenuOpen(false); onClose?.(); };
  const handleLogout = () => { setAccountMenuOpen(false); logout(); };

  return (
    <>
      {isOpen && (
        <div onClick={onClose} className="fixed inset-0 bg-black/60 z-40 md:hidden" />
      )}

      <aside className={`
        fixed md:static z-50 h-full w-64 max-w-[85vw]
        bg-[#06060c] border-r border-white/5 flex flex-col
        transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-4 md:p-5 border-b border-white/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-purple-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <img
                src="./images/logo.png"
                alt="Logo"
                className="h-7 w-7 rounded-lg"
              />
            </div>
            <span className="font-bold text-base md:text-lg tracking-tight text-white uppercase">ZI AI</span>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
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
                ? 'bg-purple-600/15 text-purple-400 border border-purple-500/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <MessageSquare size={17} />
            AI Chat Agent
          </button>

          <button
            onClick={() => setActiveTab('image')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
              activeTab === 'image'
                ? 'bg-purple-600/15 text-purple-400 border border-purple-500/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <ImageIcon size={17} />
            Image Generation
          </button>

          <Link
            to="/billingDashboard"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200"
          >
            <CreditCard size={17} />
            Billing & Plans
          </Link>
        </nav>

        {/* New Chat */}
        {activeTab === 'chat' && (
          <div className="px-3 pt-1 pb-2">
            <button
              onClick={startNewChat}
              className="w-full flex items-center gap-2 px-3 py-2 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-400 rounded-xl text-sm font-medium transition-all"
            >
              <Plus size={16} />
              New Chat
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-3 pb-2
          [&::-webkit-scrollbar]:w-1
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-purple-500/30
          [&::-webkit-scrollbar-thumb]:rounded-full
          hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/60">
          {activeTab === 'chat' ? (
            <>
              <p className="px-1 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Recent Chats
              </p>
              {loadingConversations ? (
                <div className="flex justify-center py-6
                  ">
                  <Loader2 size={18} className="text-slate-600 animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-xs text-slate-600 px-1 py-2">No conversations yet.</p>
              ) : (
                <ul className="space-y-0.5">
                  {conversations.map((conv) => (
                    <li
                      key={conv.id}
                      onClick={() => { loadConversationMessages(conv.id); onClose?.(); }}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                        activeConversationId === conv.id
                          ? 'bg-white/5 text-slate-200'
                          : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                      }`}
                    >
                      <Bot size={14} className="shrink-0 text-slate-600" />
                      <span className="text-xs truncate flex-1">{conv.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // No email needed — JWT handles auth
                          deleteConv(conv.id);
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
              <ImageSidebarHistory />
            </>
          )}
        </div>

        {/* Upgrade nudge */}
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

        {/* Footer — account popover */}
        <div ref={accountMenuRef} className="relative p-3 border-t border-white/5">
          {accountMenuOpen && (
            <div className="absolute bottom-[calc(100%-0.25rem)] left-3 right-3 z-50 rounded-xl border border-white/10 bg-[#06060c] p-1.5 shadow-2xl shadow-black/50">
              <div className="px-2.5 py-2 border-b border-white/10">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-medium text-slate-100">{displayName}</span>
                  <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-300">
                    {planLabel}
                  </span>
                </div>
                <p className="truncate text-xs text-slate-500">{displayEmail}</p>
              </div>

              <button
                onClick={() => { setAccountMenuOpen(false); setShowUpgrade(true); }}
                className="mt-1 flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <CircleArrowUp size={16} />
                Upgrade Plan
              </button>

              <button
                onClick={openSettings}
                className="mt-1 flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <Settings size={16} />
                Settings
              </button>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-slate-300 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}

          <button
            onClick={() => setAccountMenuOpen(open => !open)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-slate-200 hover:bg-white/5 transition-colors"
            aria-expanded={accountMenuOpen}
            aria-haspopup="menu"
          >
            <div className="h-9 w-9 shrink-0 rounded-full bg-white/10 text-sm font-semibold text-white flex items-center justify-center border border-white/10">
              {user ? userInitial : <UserRound size={18} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium">{displayName}</span>
                <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-300">
                  {planLabel}
                </span>
              </div>
              <p className="truncate text-xs text-slate-500">{displayEmail}</p>
            </div>
          </button>
        </div>
      </aside>

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
