// src/components/MessageInput.tsx
import { useState } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useAuth } from '@/context/useAuth';
import { Send, Loader2 } from 'lucide-react';

export default function MessageInput() {
  const [input, setInput] = useState('');
  const { send, sending } = useChatStore();
  const { user } = useAuth();

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending || !user?.email) return;
    setInput('');
    await send(trimmed, user.email);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-6 shrink-0 bg-linear-to-t from-[#05070a] via-[#05070a] to-transparent">
      <div className="max-w-3xl mx-auto relative group">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-10 group-focus-within:opacity-25 transition-opacity duration-500" />
        <div className="relative flex items-center bg-[#0a0f18] border border-slate-800 rounded-2xl overflow-hidden focus-within:border-blue-500/50 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            disabled={sending}
            className="w-full py-4 pl-6 pr-16 bg-transparent text-white placeholder-slate-600 outline-none disabled:opacity-50 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="absolute right-3 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-700 mt-2">
          ZI AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
