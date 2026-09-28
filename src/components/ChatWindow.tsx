import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useChatStore } from '@/store/useChatStore';
import { useAuth } from '@/context/useAuth';
import { BoltStyleChat } from '@/components/ui/bolt-style-chat';
import { Sparkles, Loader2, Copy, Check, Edit3, Download, Maximize2, X } from 'lucide-react';
import { uploadFiles } from '@/api/upload';
import type { Message } from '@/store/chatTypes';

const linkifyUrls = (text: string) => {
  return text.replace(/https?:\/\/[^\s<>()]+/g, (url, offset, str) => {
    const before = offset > 0 ? str[offset - 1] : '';
    const after = str[offset + url.length] || '';
    if (before === '<' || before === '(' || before === '[' || before === '"' || before === "'" || before === '=') {
      return url;
    }
    if (after === '>' || after === ')' || after === ']' || after === '"' || after === "'") {
      return url;
    }
    return `<${url}>`;
  });
};

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return String(hash >>> 0);
}

export default function ChatWindow() {
  const { messages, sending, loadingMessages, send } = useChatStore();
  const { user }   = useAuth();
  const bottomRef  = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const [activeCopyIndex, setActiveCopyIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [activeCodeCopyId, setActiveCodeCopyId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [previewImage, setPreviewImage] = useState<{ src: string; alt?: string } | null>(null);
  const [attaching, setAttaching] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    if (editingIndex === null) return;
    editInputRef.current?.focus();
    editInputRef.current?.setSelectionRange(editDraft.length, editDraft.length);
  }, [editingIndex, editDraft.length]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
      if (copyTimer.current) {
        clearTimeout(copyTimer.current);
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

  /**
   * Attachments from the empty-state hero. MessageInput isn't mounted while
   * messages.length === 0, so this is the only way to attach on a first
   * message. Uploads go through the same /library/upload endpoint and are
   * encoded as markdown links appended to the text, exactly like
   * MessageInput.handleSend, so the backend sees one consistent message shape.
   */
  const handleAttachFromEmptyState = async (files: File[], message: string) => {
    setAttaching(true);
    try {
      const uploaded = await uploadFiles(files);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const links = uploaded.files
        .map((f) => {
          const fullUrl = f.url?.startsWith('http') ? f.url : `${backendUrl}${f.url}`;
          return f.mime_type?.startsWith('image/')
            ? `\n\n![Attached: ${f.original_name}](${fullUrl})`
            : `\n\n[Attached: ${f.original_name}](${fullUrl})`;
        })
        .join('');
      await send((message.trim() || 'Sent an attachment') + links);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setAttaching(false);
    }
  };

  const handleCopy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setActiveCopyIndex(idx);
      showToast('Copied to clipboard');

      if (copyTimer.current) {
        clearTimeout(copyTimer.current);
      }
      copyTimer.current = setTimeout(() => {
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

      if (copyTimer.current) {
        clearTimeout(copyTimer.current);
      }
      copyTimer.current = setTimeout(() => {
        setActiveCodeCopyId(null);
      }, 2000);
    } catch {
      showToast('Unable to copy');
    }
  };

  const startEdit = (idx: number, content: string) => {
    setEditingIndex(idx);
    setEditDraft(content);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditDraft('');
  };

  const saveEdit = async (idx: number) => {
    const trimmed = editDraft.trim();
    if (!trimmed) return;

    setEditingIndex(null);
    setEditDraft('');
    await send(trimmed, { replaceUserIndex: idx });
  };

  const MarkdownComponents = {
    a: ({ href, children, ...props }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="text-[#c1b8ff] underline transition hover:text-white"
        {...props}
      >
        {children}
      </a>
    ),
    code: ({ inline, className, children, ...props }: any) => {
      const codeText = String(children).replace(/\n$/, '');
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
        <div className="relative mt-4 w-full max-w-full overflow-x-auto overflow-y-hidden whitespace-pre break-normal rounded-xl border border-slate-700/60 bg-slate-950/90 box-border [overflow>
        -wrap:normal] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
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
    img: ({ src, alt, ...props }: any) => (
      <div className="group relative my-4 rounded-2xl overflow-hidden border border-white/10 max-w-md bg-black/40 shadow-xl">
        <img 
          src={src} 
          alt={alt} 
          className="w-full object-cover max-h-96 cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]" 
          onClick={() => setPreviewImage({ src, alt })}
          {...props} 
        />
        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 backdrop-blur-md p-1.5 rounded-xl border border-white/10 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImage({ src, alt });
            }}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/20 transition-colors"
            title="Expand view"
            aria-label="Expand image view"
          >
            <Maximize2 size={15} />
          </button>
          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                let downloadUrl = src;
                if (!src.startsWith('data:')) {
                  const res = await fetch(src);
                  const blob = await res.blob();
                  downloadUrl = URL.createObjectURL(blob);
                }
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `generated-${Date.now()}.png`;
                a.click();
                if (!src.startsWith('data:')) URL.revokeObjectURL(downloadUrl);
                showToast('Image downloaded');
              } catch {
                showToast('Failed to download image');
              }
            }}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/20 transition-colors"
            title="Download image"
            aria-label="Download image"
          >
            <Download size={15} />
          </button>
        </div>
      </div>
    ),
  };

  // Loading state
  if (loadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={28} className="text-[#9b8cff] animate-spin" />
      </div>
    );
  }

  // Empty state — shown before any messages
  if (messages.length === 0 && !sending) {
    return (
      <BoltStyleChat
        title="What will you"
        subtitle="Create stunning apps & websites by chatting with AI."
        onSend={(message) => {
          if (message.trim()) {
            void send(message);
          }
        }}
        attaching={attaching}
        onAttach={handleAttachFromEmptyState}
      />
    );
  }

  // NOTE: No overflow-y-auto here — ChatPage owns the scroll container
  return (
    <div className="py-8 px-4">
      <div className="max-w-3xl mx-auto w-full space-y-6">

        {messages.map((msg: Message, idx: number) => {
          const isAssistant = msg.role === 'assistant';
          const isCopied = activeCopyIndex === idx;
          const isEditing = editingIndex === idx;
          const bubbleClasses = isAssistant
            ? 'bg-[#100d20]/90 border border-[#9b8cff]/15 text-slate-100'
            : 'bg-gradient-to-r from-[#4938b8] to-[#7966f4] text-white';
          const textPadding = isEditing ? 'pl-4 pr-4 py-4' : 'pl-4 pr-24 py-4';

          return (
            <div key={idx} className={`flex gap-3 items-start ${isAssistant ? '' : 'justify-end'}`}>
              {isAssistant && (
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#a99cff] to-[#6550ed] flex items-center justify-center shrink-0 border border-[#c1b8ff]/30 shadow-lg shadow-[#7764ff]/20">
                  <Sparkles size={16} className="text-white" />
                </div>
              )}

              <div className={`relative max-w-[85%] overflow-hidden ${bubbleClasses} rounded-[20px] shadow-[0_30px_80px_-60px_rgba(15,23,42,0.75)]`}>
                {!isAssistant && !isEditing && (
                  <button
                    type="button"
                    onClick={() => startEdit(idx, msg.content)}
                    className="absolute top-3 right-12 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/70 text-slate-200 transition duration-200 ease-out hover:bg-slate-800/90 hover:text-white"
                    aria-label="Edit message"
                  >
                    <Edit3 size={16} />
                  </button>
                )}
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.content, idx)}
                    className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/70 text-slate-200 transition duration-200 ease-out hover:bg-slate-800/90 hover:text-white"
                    aria-label="Copy message"
                  >
                    {isCopied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                )}
                <div className={`min-h-12 whitespace-pre-wrap wrap-break-word ${textPadding}`}>
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        ref={editInputRef}
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        className="w-full min-h-22.5 resize-y rounded-xl border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-100 outline-none"
                        placeholder="Edit your question"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => void saveEdit(idx)}
                          disabled={!editDraft.trim() || sending}
                          className="rounded-lg bg-[#6550ed] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#7764ff] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Save & resend
                        </button>
                      </div>
                    </div>
                  ) : isAssistant ? (
                    <div className="prose prose-invert w-full overflow-hidden text-xs md:text-sm lg:text-base prose-sm max-w-none text-slate-200 leading-relaxed">
                      <ReactMarkdown components={MarkdownComponents}>{linkifyUrls(msg.content)}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="prose prose-invert w-full overflow-hidden text-sm max-w-none text-white leading-relaxed">
                      <ReactMarkdown components={MarkdownComponents}>{linkifyUrls(msg.content)}</ReactMarkdown>
                    </div>
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
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#a99cff] to-[#6550ed] flex items-center justify-center shrink-0 border border-[#c1b8ff]/30">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none shadow-xl">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#c1b8ff] rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-[#c1b8ff] rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-[#c1b8ff] rounded-full animate-bounce [animation-delay:300ms]" />
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

      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-5xl w-full rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 p-3 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/70 text-slate-300 hover:text-white hover:bg-black/90 border border-white/10 transition-all"
              aria-label="Close preview"
            >
              <X size={20} />
            </button>
            <img src={previewImage.src} alt={previewImage.alt || 'Preview'} className="w-full max-h-[80vh] object-contain rounded-2xl bg-black" />
            <div className="w-full p-3 flex items-center justify-between gap-4">
              <p className="text-xs text-slate-300 font-mono truncate">{previewImage.alt || 'Generated Image'}</p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    let downloadUrl = previewImage.src;
                    if (!previewImage.src.startsWith('data:')) {
                      const res = await fetch(previewImage.src);
                      const blob = await res.blob();
                      downloadUrl = URL.createObjectURL(blob);
                    }
                    const a = document.createElement('a');
                    a.href = downloadUrl;
                    a.download = `generated-${Date.now()}.png`;
                    a.click();
                    if (!previewImage.src.startsWith('data:')) URL.revokeObjectURL(downloadUrl);
                    showToast('Image downloaded');
                  } catch {
                    showToast('Failed to download image');
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#6550ed] px-4 py-2 text-xs font-medium text-white hover:bg-[#7764ff] transition-all shrink-0 shadow-lg shadow-[#7764ff]/20"
              >
                <Download size={14} /> Download Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
