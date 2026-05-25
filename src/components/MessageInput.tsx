// src/components/MessageInput.tsx
import { useRef, useState } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { ArrowUp, Loader2 } from 'lucide-react';

export default function MessageInput() {
  const [input, setInput]     = useState('');
  const { send, sending }     = useChatStore();
  const textareaRef           = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setInput('');
    // Reset textarea height after clearing
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    // No email needed — backend reads from JWT
    await send(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  // Auto-resize up to 200px
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="px-4 pb-4 pt-2 shrink-0">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-end bg-[#2f2f2f] rounded-2xl px-4 py-3 gap-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Message ZI AI"
            disabled={sending}
            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none resize-none text-sm leading-6 max-h-50 disabled:opacity-50"
          />
          <button
            onClick={() => void handleSend()}
            disabled={sending || !input.trim()}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:bg-slate-200 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            {sending
              ? <Loader2 size={16} className="animate-spin text-black" />
              : <ArrowUp size={16} />
            }
          </button>
        </div>
        <p className="text-center text-[11px] text-slate-600 mt-2">
          ZI AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
