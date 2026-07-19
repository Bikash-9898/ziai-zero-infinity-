// src/components/ChatWindow.tsx
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import { useChatStore } from '@/store/useChatStore';
import { useAuth } from '@/context/useAuth';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return String(hash >>> 0);
}

export default function ChatWindow() {
  const { messages, sending, loadingMessages } = useChatStore();
  const { user }   = useAuth();
  const bottomRef  = useRef<HTMLDivElement>(null);
  const [activeCopyIndex, setActiveCopyIndex] = useState<number | null>(null);
  const [activeCodeCopyId, setActiveCodeCopyId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => {
      setToastMessage('');
    }, 2000);
  };

  const handleCopy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setActiveCopyIndex(idx);
      showToast('Copied to clipboard');

      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
      toastTimer.current = setTimeout(() => {
        setActiveCopyIndex(null);
      }, 2000);
    } catch {
      showToast('Unable to copy');
    }
  };

  const handleCopyCode = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setActiveCodeCopyId(id);
      showToast('Copied to clipboard');

      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
      toastTimer.current = setTimeout(() => {
        setActiveCodeCopyId(null);
      }, 2000);
    } catch {
      showToast('Unable to copy');
    }
  };

  const MarkdownComponents: Components = {
    code({ className, children, ...props }) {
      const codeText = String(children).replace(/\n$/, '');
      const inline = !className; // see note below
      if (inline) {
        return (
          <code className="rounded-md bg-slate-800/70 px-1.5 py-0.5 text-slate-100 font-mono text-sm" {...props}>
            {codeText}
          </code>
        );
      }

      const codeId = `${className ?? 'code'}-${hashString(codeText)}`;
      const copied = activeCodeCopyId === codeId;

      return (
        <div className="relative mt-4 w-full max-w-full overflow-x-auto overflow-y-hidden whitespace-pre break-normal rounded-xl border border-slate-700/60 bg-slate-950/90 box-border wrap-normal shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
          <button
            type="button"
            onClick={() => handleCopyCode(codeText, codeId)}
            className="group absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-slate-200 shadow-lg shadow-black/20 transition duration-200 hover:bg-slate-800/90 hover:text-white"
            aria-label="Copy code"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            <span className="pointer-events-none absolute -top-9 right-0 hidden rounded-md bg-slate-900/95 px-2 py-1 text-[11px] text-slate-100 shadow-lg transition duration-200 group-hover:block">
              Copy code
            </span>
          </button>
          <pre className="m-0 overflow-x-auto overflow-y-hidden whitespace-pre bg-transparent p-5 text-sm leading-6 font-mono text-slate-100
            [&::-webkit-scrollbar]:w-1
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-purple-500/30
            [&::-webkit-scrollbar-thumb]:rounded-full
            hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/60
          ">
            <code className={`${className ?? ''} block min-w-max whitespace-pre`} {...props}>
              {codeText}
            </code>
          </pre>
        </div>
      );
    },
  };

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

        {messages.map((msg, idx) => {
          const isAssistant = msg.role === 'assistant';
          const isCopied = activeCopyIndex === idx;
          const bubbleClasses = isAssistant
            ? 'bg-slate-800 border border-white/10 text-slate-100'
            : 'bg-gradient-to-r from-purple-700 to-violet-600 text-white';
          const textPadding = isAssistant ? 'pl-4 pr-14 py-4' : 'pl-4 pr-14 py-4';

          return (
            <div key={idx} className={`flex gap-3 items-start ${isAssistant ? '' : 'justify-end'}`}>
              {isAssistant && (
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-purple-600 to-blue-500 flex items-center justify-center shrink-0 border border-purple-400/30 shadow-lg shadow-purple-500/10">
                  <Sparkles size={16} className="text-white" />
                </div>
              )}

              <div className={`relative max-w-[85%] overflow-hidden ${bubbleClasses} rounded-[20px] shadow-[0_30px_80px_-60px_rgba(15,23,42,0.75)]`}>
                <button
                  type="button"
                  onClick={() => handleCopy(msg.content, idx)}
                  className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/70 text-slate-200 transition duration-200 ease-out hover:bg-slate-800/90 hover:text-white"
                  aria-label="Copy message"
                >
                  {isCopied ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <div className={`min-h-12 whitespace-pre-wrap wrap-break-word ${textPadding}`}>
                  {isAssistant ? (
                    <div className="prose prose-invert w-full overflow-hidden text-xs md:text-sm lg:text-base prose-sm max-w-none text-slate-200 leading-relaxed">
                      <ReactMarkdown components={MarkdownComponents}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="w-full overflow-hidden text-sm leading-relaxed">{msg.content}</div>
                  )}
                </div>
              </div>

              {!isAssistant && (
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 text-xs font-bold text-slate-300">
                  {user?.username?.[0]?.toUpperCase() ?? 'U'}
                </div>
              )}
            </div>
          );
        })}

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

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900/95 px-4 py-2 text-sm text-slate-100 shadow-xl shadow-black/40 border border-white/10">
          {toastMessage}
        </div>
      )}
    </div>
  );
}