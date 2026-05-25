// src/components/ChatWindow.tsx
import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useChatStore } from '@/store/useChatStore';
import { useAuth } from '@/context/useAuth';
import { Sparkles, Loader2 } from 'lucide-react';

export default function ChatWindow() {
  const { messages, sending, loadingMessages } = useChatStore();
  const { user }   = useAuth();
  const bottomRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Loading state
  if (loadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={28} className="text-purple-500 animate-spin" />
      </div>
    );
  }

  // Empty state — shown before any messages
  if (messages.length === 0 && !sending) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-purple-600 to-blue-500 flex items-center justify-center mb-5 shadow-lg shadow-purple-500/20">
          <Sparkles size={22} className="text-white" />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">How can I help you today?</h1>
        <p className="text-sm text-slate-500 max-w-sm">Ask me anything — I'm your AI assistant.</p>
      </div>
    );
  }

  // NOTE: No overflow-y-auto here — ChatPage owns the scroll container
  return (
    <div className="py-8 px-4">
      <div className="max-w-3xl mx-auto w-full space-y-6">

        {messages.map((msg, idx) =>
          msg.role === 'assistant' ? (
            <div key={idx} className="flex gap-3 items-start">
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-purple-600 to-blue-500 flex items-center justify-center shrink-0 border border-purple-400/30 shadow-lg shadow-purple-500/10">
                <Sparkles size={16} className="text-white" />
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl rounded-tl-none shadow-xl max-w-[85%]">
                <div className="prose prose-invert text-xs md:text-sm lg:text-base prose-sm max-w-none text-slate-300 leading-relaxed">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            <div key={idx} className="flex gap-3 items-start justify-end">
              <div className="bg-purple-600/20 border border-purple-500/30 text-slate-200 p-4 rounded-2xl rounded-tr-none shadow-xl max-w-[75%] text-sm leading-relaxed">
                {msg.content}
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 text-xs font-bold text-slate-300">
                {user?.username?.[0]?.toUpperCase() ?? 'U'}
              </div>
            </div>
          )
        )}

        {/* Typing indicator */}
        {sending && (
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-purple-600 to-blue-500 flex items-center justify-center shrink-0 border border-purple-400/30">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none shadow-xl">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
