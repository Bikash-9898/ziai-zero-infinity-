// src/components/MessageInput.tsx
import { useState } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { Send, Loader2 } from 'lucide-react';

export default function MessageInput() {
  const [input, setInput] = useState('');
  const { send, sending } = useChatStore();

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setInput('');
    // No longer needs user email — backend reads from JWT
    await send(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="p-6 shrink-0 bg-linear-to-t from-[#06060c] via-[#06060c] to-transparent">
      <div className="max-w-3xl mx-auto relative group">
        <div className="relative flex items-center bg-[#06060c] border border-white/10 rounded-2xl overflow-hidden focus-within:border-purple-500/50 transition-all">
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
            onClick={() => void handleSend()}
            disabled={sending || !input.trim()}
            className="absolute right-3 p-2 bg-linear-to-br from-purple-600 to-blue-500 text-white rounded-xl hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
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
