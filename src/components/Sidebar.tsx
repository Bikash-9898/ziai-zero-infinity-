// src/components/Sidebar.tsx
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { useChatStore } from '@/store/useChatStore';
import { useImageStore } from '@/store/useImageStore';
import type { GeneratedImage } from '@/types/image';
import {
  MessageSquare,
  Image as ImageIcon,
  Archive,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Loader2,
  Bot,
  CreditCard,
  Download,
  // Zap,
  X,
  UserRound,
  CircleArrowUp,
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

const PLAN_COLORS: Record<string, string> = {
  free:       '#64748b',
  basic:      '#06b6d4',
  pro:        '#6366f1',
  enterprise: '#f59e0b',
};

export default function Sidebar({ onClose }: SidebarProps) {
  const { user, logout }                        = useAuth();
  const navigate                                = useNavigate();
  const location                                = useLocation();
  const [accountMenuOpen, setAccountMenuOpen]   = useState(false);
  const accountMenuRef                          = useRef<HTMLDivElement>(null);

  // ── Active tab derived from URL ────────────────────────────────────────────
  const activeTab = location.pathname.startsWith('/client/image')
    ? 'image'
    : location.pathname.startsWith('/client/library')
      ? 'library'
    : location.pathname.startsWith('/client/settings')
      ? 'settings'
      : 'chat';

  // ── Derived user info ──────────────────────────────────────────────────────
  const displayName  = user?.username || 'Guest';
  const displayEmail = user?.is_guest ? 'Sign in to save your chats' : (user?.email || 'Not signed in');
  const userInitial  = displayName.trim().charAt(0).toUpperCase() || 'U';
  const planLabel    = user?.plan ?? 'Free';
  const planColor    = PLAN_COLORS[user?.plan ?? 'free'] ?? '#64748b';
  const isFreePlan   = !user?.plan || user.plan === 'free';

  // ── Chat store ─────────────────────────────────────────────────────────────
  const {
    conversations,
    loadingConversations,
    fetchConversations,
    activeConversationId,
    loadConversationMessages,
    deleteConv,
    startNewChat,
  } = useChatStore();

  // ── Image store ────────────────────────────────────────────────────────────
  const { history: imageHistory, status: imageStatus } = useImageStore();
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);

  // ── Fetch conversations on mount ───────────────────────────────────────────
  useEffect(() => {
    if (user?.email) fetchConversations();
  }, [user?.email, fetchConversations]);

  // ── Click-outside / Escape for account menu ────────────────────────────────
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

  const openSettings = () => {
    setAccountMenuOpen(false);
    navigate('/client/settings');
    onClose?.();
  };
  const handleLogout = () => {
    setAccountMenuOpen(false);
    logout();
    navigate('/');
    onClose?.();
  };

  const handleImageDownload = async (url: string) => {
    try {
      let downloadUrl = url;
      if (!url.startsWith('data:')) {
        const response = await fetch(url);
        const blob = await response.blob();
        downloadUrl = URL.createObjectURL(blob);
      }

      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = 'generated-image.png';
      anchor.click();
      if (!url.startsWith('data:')) URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to download image', err);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const navBtn = (
    to: string,
    icon: React.ReactNode,
    label: string,
    tab: string,
  ) => (
    <Link
      to={to}
      onClick={onClose}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
        activeTab === tab
          ? 'bg-purple-600/15 text-purple-400 border border-purple-500/20'
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      {icon}
      {label}
    </Link>
  );

  return (
    <>
      <aside className="h-full w-64 max-w-[85vw] bg-[#06060c] border-r border-white/5 flex flex-col">

        {/* ── Logo ── */}
        <div className="p-4 md:p-5 border-b border-white/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-purple-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <img src="/images/logo.png" alt="Logo" className="h-7 w-7 rounded-lg" />
            </div>
            <span className="font-bold text-base md:text-lg tracking-tight text-white uppercase">ZI AI</span>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* ── Plan badge ── */}
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
                onClick={() => { navigate('/plans'); onClose?.(); }}
                style={{ color: planColor }}
                className="text-[10px] font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
              >
                Upgrade
              </button>
            )}
          </div>
        </div>

        {/* ── Nav ── */}
        <nav className="p-3 space-y-1">
          {navBtn('/client/chat',     <MessageSquare size={17} />, 'AI Chat Agent',     'chat')}
          {navBtn('/client/image',    <ImageIcon size={17} />,     'Image Generation',  'image')}
          {navBtn('/client/library',  <Archive size={17} />,       'Library',           'library')}
          <Link
            to="/billingDashboard"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200"
          >
            <CreditCard size={17} />
            Billing &amp; Plans
          </Link>
        </nav>

        {/* ── New Chat / New Image button ── */}
        {activeTab === 'chat' && (
          <div className="px-3 pt-1 pb-2">
            <button
              onClick={() => { startNewChat(); onClose?.(); }}
              className="w-full flex items-center gap-2 px-3 py-2 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-400 rounded-xl text-sm font-medium transition-all"
            >
              <Plus size={16} />
              New Chat
            </button>
          </div>
        )}
        {activeTab === 'image' && (
          <div className="px-3 pt-1 pb-2">
            {/* "New Image" just navigates to the image page — ImagePage resets on mount */}
            <Link
              to="/client/image"
              onClick={onClose}
              className="w-full flex items-center gap-2 px-3 py-2 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-400 rounded-xl text-sm font-medium transition-all"
            >
              <Plus size={16} />
              New Image
            </Link>
          </div>
        )}

        {/* ── Scrollable history ── */}
        <div className="flex-1 overflow-y-auto px-3 pb-2
          [&::-webkit-scrollbar]:w-1
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-purple-500/30
          [&::-webkit-scrollbar-thumb]:rounded-full
          hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/60">

          {/* Chat history */}
          {activeTab === 'chat' && (
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
                        onClick={(e) => { e.stopPropagation(); deleteConv(conv.id); }}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* Image history */}
          {activeTab === 'image' && (
            <>
              <p className="px-1 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Recent Images
              </p>

              {imageStatus === 'generating' && (
                <div className="text-center py-6">
                  <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-[10px] text-slate-600 font-mono">Generating…</p>
                </div>
              )}

              {imageStatus !== 'generating' && imageHistory.length === 0 && (
                <div className="text-center py-8">
                  <ImageIcon size={24} className="text-slate-700 mx-auto mb-2" />
                  <p className="text-[11px] text-slate-600 font-mono">No generations yet</p>
                </div>
              )}

              {imageStatus !== 'generating' && imageHistory.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {imageHistory.slice(0, 12).map((img) => (
                    <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-slate-800/60 hover:border-slate-600 transition-all">
                      <button
                        type="button"
                        onClick={() => setPreviewImage(img)}
                        className="absolute inset-0 z-10"
                        title={img.prompt}
                      />
                      <img
                        src={img.image_url}
                        alt={img.prompt}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          event.preventDefault();
                          handleImageDownload(img.image_url);
                        }}
                        className="absolute bottom-2 right-2 z-20 rounded-full bg-slate-950/90 p-2 text-slate-100 shadow-lg shadow-black/30 hover:bg-slate-900"
                        title="Download image"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Upgrade nudge ── */}
        {/* {isFreePlan && (
          <div className="px-3 pb-2">
            <button
              onClick={() => { navigate('/plans'); onClose?.(); }}
              style={{ borderColor: '#6366f133', background: 'linear-gradient(135deg,#6366f10a,#4f46e50a)' }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all hover:border-indigo-500/30"
            >
              <Zap size={15} className="text-indigo-400" />
              <div className="text-left">
                <p className="text-[11px] font-bold text-indigo-400">Upgrade for more</p>
                <p className="text-[10px] text-slate-600">Tokens · Images · Speed</p>
              </div>
            </button>
          </div>
        )} */}

        {/* ── Preview popup for sidebar images ── */}
        {previewImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="relative max-w-3xl w-full rounded-3xl overflow-hidden border border-slate-800 bg-slate-950"
              onClick={(event) => event.stopPropagation()}
            >
              <img
                src={previewImage.image_url}
                alt={previewImage.prompt}
                className="w-full max-h-[80vh] object-contain bg-black"
              />
              <div className="p-4">
                <p className="text-sm text-slate-200 font-mono leading-relaxed">{previewImage.prompt}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
                  <span>{previewImage.model}</span>
                  <span>{new Date(previewImage.created_at).toLocaleString()}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleImageDownload(previewImage.image_url)}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700"
                  >
                    <Download size={14} /> Download
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewImage(null)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                  >
                    <X size={14} /> Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer — account popover ── */}
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
                onClick={() => { setAccountMenuOpen(false); navigate('/plans'); onClose?.(); }}
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
            onClick={() => setAccountMenuOpen(o => !o)}
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

    </>
  );
}