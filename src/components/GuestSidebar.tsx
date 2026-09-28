import { Plus, X, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useChatStore } from '../store/useChatStore';

interface GuestSidebarProps {
  onClose?: () => void;
  onOpenSignIn?: () => void;
}

export default function GuestSidebar({ onClose, onOpenSignIn }: GuestSidebarProps) {
  const { startNewChat } = useChatStore();

  const handleNewChat = () => {
    startNewChat();
    onClose?.();
  };

  const handleSignUp = () => {
    onOpenSignIn?.();
    onClose?.();
  };

  return (
    <aside className="h-full w-64 max-w-[85vw] bg-[#05040b] border-r border-[#9b8cff]/10 flex flex-col">
      <div className="p-4 md:p-5 border-b border-white/5 flex items-center justify-between gap-3">
        <Link
          to="/"
          onClick={onClose}
          aria-label="ZI AI home"
          className="flex items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9b8cff]"
        >
          <div className="h-9 w-9 rounded-xl bg-linear-to-br from-[#a99cff] to-[#6550ed] flex items-center justify-center shadow-lg shadow-[#7764ff]/25">
            <img src="/images/logo.png" alt="Logo" className="h-7 w-7 rounded-lg" />
          </div>
          <span className="font-bold text-base md:text-lg tracking-tight text-white uppercase">ZI AI</span>
        </Link>
        <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 bg-[#9b8cff]/10 hover:bg-[#9b8cff]/20 border border-[#9b8cff]/20 text-[#c1b8ff] rounded-xl text-sm font-medium transition-all"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-2">
        <p className="px-1 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recent Chats</p>
        <div className="flex flex-col items-center justify-center h-40 text-slate-600">
          <MessageSquare size={28} className="opacity-20" />
          <p className="text-xs mt-2">Sign up to save your history</p>
        </div>
      </div>

      <div className="p-3 border-t border-white/5">
        <button
          onClick={handleSignUp}
          className="w-full bg-white text-black py-2.5 rounded-xl hover:bg-gray-200 transition font-medium text-sm"
        >
          Sign up
        </button>
        <p className="text-[10px] text-slate-500 text-center mt-2">
          Already have an account?{' '}
          <button onClick={handleSignUp} className="text-[#c1b8ff] hover:underline">
            Log in
          </button>
        </p>
      </div>
    </aside>
  );
}