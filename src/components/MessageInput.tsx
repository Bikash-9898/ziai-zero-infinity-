// src/components/MessageInput.tsx
import { useRef, useState, useEffect } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useAuth } from '@/context/useAuth';
import {
  ArrowUp,
  Paperclip,
  Square,
  X,
  File as FileIcon,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { uploadFiles } from '@/api/upload';
import { toast } from 'react-hot-toast';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import SpeechRecognitionToggle, { SpeechActivePanel } from '@/components/voice/SpeechRecognitionToggle';
import { BsSoundwave } from 'react-icons/bs';
import VoiceConversationMode from '@/components/voice/VoiceConversationMode';

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

export default function MessageInput() {
  const { send, sending, stopCurrentResponse } = useChatStore();
  const { user } = useAuth();

  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    status: speechStatus,
    errorMsg: speechErrorMsg,
    stream: speechStream,
    language: speechLang,
    updateLanguage: setSpeechLang,
    start: startSpeech,
    stop: stopSpeech,
    cancel: cancelSpeech,
    clearTranscript,
  } = useSpeechToText({
    onTranscriptChange: (text) => {
      setInput(text);
      // Auto-resize textarea as speech transcribes
      const el = textareaRef.current;
      if (el) {
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
      }
    },
  });

  const placeholderOptions = [
    'Ask for the quick answer',
    'Summarize this plan in English',
    'Explain this quickly',
  ];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % placeholderOptions.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const plan = user?.plan?.toLowerCase() || 'free';
  const MAX_FILES = plan === 'free' ? 10 : plan === 'pro' ? 100 : Infinity;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFilesSelected = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;

    if (attachments.length + fileArray.length > MAX_FILES) {
      setShowLimitWarning(true);
      return;
    }

    const newAttachments = fileArray.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'uploading' as const,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);

    for (const attachment of newAttachments) {
      try {
        const response = await uploadFiles([attachment.file], (progress) => {
          setAttachments((prev) =>
            prev.map((a) => (a.id === attachment.id ? { ...a, progress } : a))
          );
        });
        setAttachments((prev) =>
          prev.map((a) =>
            a.id === attachment.id
              ? { ...a, status: 'success', progress: 100, url: (response as any).files[0].url }
              : a
          )
        );
      } catch (err: any) {
        setAttachments((prev) =>
          prev.map((a) =>
            a.id === attachment.id
              ? { ...a, status: 'error', error: err.message || 'Upload failed' }
              : a
          )
        );
        toast.error(`Failed to upload ${attachment.file.name}`);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files?.length) void handleFilesSelected(e.dataTransfer.files);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    const hasSuccessFiles = attachments.some((a) => a.status === 'success');
    if ((!trimmed && !hasSuccessFiles) || sending) return;

    const messageContent = trimmed || 'Sent an attachment';
    setInput('');

    const fileLinks = attachments
      .filter((a) => a.status === 'success')
      .map((a) => {
        const isImage = a.file.type.startsWith('image/');
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const fullUrl = a.url?.startsWith('http') ? a.url : `${backendUrl}${a.url}`;
        return isImage
          ? `\n\n![Attached: ${a.file.name}](${fullUrl})`
          : `\n\n[Attached: ${a.file.name}](${fullUrl})`;
      })
      .join('');

    const finalMessage = messageContent + fileLinks;
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await send(finalMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="px-4 pb-4 pt-2 shrink-0 relative">

      {showLimitWarning && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-[90%] max-w-sm bg-[#1e1e1e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl shadow-black/50 z-50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-500/10 rounded-full shrink-0">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h4 className="text-white font-medium mb-1">Limit Reached</h4>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                You've reached the {plan === 'free' ? 'Free' : 'Pro'} plan limit of {MAX_FILES} attached files.
                Upgrade for larger uploads and higher limits.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowLimitWarning(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Dismiss
                </button>
                {plan === 'free' && (
                  <button
                    onClick={() => {
                      setShowLimitWarning(false);
                      window.location.href = '/admin/billing';
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-black bg-white hover:bg-slate-200 transition-colors"
                  >
                    Upgrade to Pro
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex flex-col bg-[#2f2f2f] rounded-2xl transition-all duration-300 ${
            isDragging ? 'ring-2 ring-blue-500 bg-[#3a3a3a]' : ''
          }`}
        >
          <SpeechActivePanel
            status={speechStatus}
            errorMsg={speechErrorMsg}
            stream={speechStream}
            language={speechLang}
            onStart={startSpeech}
            onStop={stopSpeech}
            onCancel={cancelSpeech}
            onClear={clearTranscript}
          />

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 border-b border-white/10 max-h-40 overflow-y-auto custom-scrollbar">
              {attachments.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex items-center gap-3 p-2 pr-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all w-60"
                >
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-[#1e1e1e] flex items-center justify-center text-slate-400">
                    {item.file.type.startsWith('image/') ? <ImageIcon size={20} /> : <FileIcon size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{item.file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500 font-medium">
                        {formatSize(item.file.size)}
                      </span>
                      {item.status === 'uploading' && (
                        <div className="flex-1 h-1 rounded-full bg-black/50 overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                      {item.status === 'success' && <CheckCircle2 size={12} className="text-green-500" />}
                      {item.status === 'error' && <AlertCircle size={12} className="text-red-500" />}
                    </div>
                  </div>
                  <button
                    onClick={() => removeAttachment(item.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-red-500/80 transition-all"
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end px-3 py-2.5 gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              title="Attach files"
              aria-label="Attach files"
            >
              <Paperclip size={18} />
            </button>

            <SpeechRecognitionToggle
              status={speechStatus}
              language={speechLang}
              onLanguageChange={setSpeechLang}
              onStart={startSpeech}
              onStop={stopSpeech}
            />

            <input
              type="file"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => e.target.files && void handleFilesSelected(e.target.files)}
            />

            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={isDragging ? 'Drop files here...' : placeholderOptions[placeholderIdx]}
              disabled={sending}
              className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none resize-none text-sm leading-6 max-h-50 disabled:opacity-50 py-1"
              aria-label="Message input"
            />

            <AnimatePresence>
              {input && !sending && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => {
                    setInput('');
                    textareaRef.current?.focus();
                  }}
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-slate-500 hover:bg-white/10 hover:text-white transition-colors"
                  aria-label="Clear text"
                  title="Clear text"
                >
                  <X size={14} />
                </motion.button>
              )}
            </AnimatePresence>

            {sending ? (
              <button
                type="button"
                onClick={stopCurrentResponse}
                className="shrink-0 h-8 px-3 flex items-center justify-center gap-2 rounded-full bg-red-500/90 text-white hover:bg-red-500 transition-colors"
                aria-label="Stop answering"
                title="Stop answering"
              >
                <Square size={14} fill="currentColor" />
                <span className="text-xs font-medium">Stop</span>
              </button>
            ) : (!input.trim() && attachments.length === 0) ? (
              <button
                type="button"
                onClick={() => setIsVoiceModeOpen(true)}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md shadow-purple-900/20"
                aria-label="Start voice conversation"
                title="Start voice conversation"
              >
                <BsSoundwave size={17} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:bg-slate-200 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <ArrowUp size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      <VoiceConversationMode isOpen={isVoiceModeOpen} onClose={() => setIsVoiceModeOpen(false)} />
    </div>
  );
}
