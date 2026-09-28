import { useRef, useState, useEffect } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useAuth } from '@/context/useAuth';
import {
  Paperclip,
  Square,
  X,
  File as FileIcon,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sparkles,
  Palette,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { uploadFiles } from '@/api/upload';
import { toast } from 'react-hot-toast';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import SpeechRecognitionToggle, { SpeechActivePanel } from '@/components/voice/SpeechRecognitionToggle';
import VoiceConversationMode from '@/components/voice/VoiceConversationMode';
import { ShinyButton } from '@/components/ui/shiny-button';

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

export default function MessageInput() {
  const { send, sending, stopCurrentResponse, modelSupportsImages } = useChatStore();
  const { user } = useAuth();

  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  // Image Generation Modal State
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalPrompt, setModalPrompt] = useState('');
  const [modalModel, setModalModel] = useState('flux');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // useSpeechToText reports the transcript of the *current* dictation session,
  // and sends '' whenever it resets (pause/resume/cancel/clear). Assigning it
  // straight to `input` therefore wiped anything already typed. Anchor the
  // session to the text present when dictation began and append instead.
  const speechBaseRef = useRef<string | null>(null);

  const {
    status: speechStatus,
    errorMsg: speechErrorMsg,
    stream: speechStream,
    language: speechLang,
    start: startSpeech,
    stop: stopSpeech,
    cancel: cancelSpeech,
    clearTranscript,
  } = useSpeechToText({
    onTranscriptChange: (text) => {
      if (speechBaseRef.current === null) speechBaseRef.current = input;
      const base = speechBaseRef.current;
      setInput(base && text ? `${base} ${text}` : text || base || '');
      // Auto-resize textarea as speech transcribes
      const el = textareaRef.current;
      if (el) {
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
      }
    },
  });

  // Re-anchor on every new dictation so the base is always the current input.
  const beginSpeech = () => {
    speechBaseRef.current = null;
    void startSpeech();
  };

  const placeholderOptions = [
    'What do you want to build?',
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

      <div className="w-full max-w-[850px] mx-auto">
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex flex-col bg-[#100d20]/90 rounded-2xl ring-1 ring-[#9b8cff]/15 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_2px_20px_rgba(0,0,0,0.4)] transition-all duration-300 ${
            isDragging ? 'ring-2 ring-[#9b8cff] bg-[#171324]' : ''
          }`}
        >
          <SpeechActivePanel
            status={speechStatus}
            errorMsg={speechErrorMsg}
            stream={speechStream}
            language={speechLang}
            onStart={beginSpeech}
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
                            className="h-full bg-[#9b8cff] transition-all duration-300"
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

          {/* Warning when image attachments exist but model doesn't support vision */}
          {attachments.some((a) => a.file.type.startsWith('image/')) && !modelSupportsImages && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs">
              <AlertCircle size={13} className="shrink-0" />
              <span>
                <strong>This model does not support image input.</strong> Images will be ignored. Switch to a vision model (GPT-4o, Claude, Gemini) to analyze images.
              </span>
            </div>
          )}

          <div className="flex flex-col">
            <div className="order-2 flex w-full items-center gap-2 px-4 pb-3">
              <div className="relative">
              <button
                type="button"
                onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.08] text-slate-400 hover:bg-white/[0.12] hover:text-white transition-colors"
                title="More options"
                aria-label="More options"
              >
                <Plus size={18} />
              </button>

              <AnimatePresence>
                {isPlusMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 mb-2 w-48 bg-[#1e1e1e] ring-1 ring-white/10 rounded-xl shadow-xl z-50 p-1.5 flex flex-col"
                  >
                    <button
                      type="button"
                      onClick={() => {
                         setIsPlusMenuOpen(false);
                         fileInputRef.current?.click();
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors text-left"
                    >
                       <Paperclip size={16} />
                       Attach Files
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                         setIsPlusMenuOpen(false);
                         setIsImageModalOpen(true);
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors text-left"
                    >
                       <Palette size={16} />
                       Create Image
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>

              <SpeechRecognitionToggle
                status={speechStatus}
                onStart={beginSpeech}
                onStop={stopSpeech}
              />
              <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => e.target.files && void handleFilesSelected(e.target.files)}
              />

              <div className="min-w-0 flex-1" aria-hidden="true" />

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
                  className="shrink-0 h-11 px-4 flex items-center justify-center gap-2 rounded-full bg-red-500/90 text-white hover:bg-red-500 transition-colors"
                  aria-label="Stop answering"
                  title="Stop answering"
                >
                  <Square size={14} fill="currentColor" />
                  <span className="text-xs font-medium">Stop</span>
                </button>
              ) : (
                <ShinyButton
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={sending || (!input.trim() && attachments.length === 0)}
                  highlightColor="#c1b8ff"
                  className="ml-auto shrink-0 inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-medium shadow-[0_0_20px_rgba(119,100,255,0.3)] [--shiny-cta-padding:0_24px] [--shiny-cta-font-size:14px] [--shiny-cta-bg:#6550ed]"
                  aria-label="Send message"
                >
                  <span className="inline">Build now</span>
                </ShinyButton>
              )}
            </div>

            <div className="order-1 flex w-full min-w-0 flex-col px-6 pt-5 pb-3">
              {(input.trim().startsWith('/imagine') || input.trim().startsWith('/image')) && (
                <div className="flex items-center gap-2 px-2 py-1 mb-1 bg-purple-500/15 border border-purple-500/20 rounded-lg text-purple-300 text-xs font-medium shrink-0">
                  <Sparkles size={13} className="animate-pulse text-purple-400 shrink-0" />
                  <span className="truncate">Image Generation Mode — Press Enter to generate image</span>
                </div>
              )}
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={isDragging ? 'Drop files here...' : placeholderOptions[placeholderIdx]}
                disabled={sending}
                className="w-full min-h-20 bg-transparent text-[15px] leading-6 text-white placeholder-[#5a5a5f] outline-none resize-none max-h-50 disabled:opacity-50"
                aria-label="Message input"
              />
            </div>

          </div>
        </div>
      </div>
      <VoiceConversationMode isOpen={isVoiceModeOpen} onClose={() => setIsVoiceModeOpen(false)} />

      {/* Image Generation Modal */}
      <AnimatePresence>
        {isImageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-[#181825] border border-purple-500/20 rounded-3xl p-6 shadow-2xl text-white relative"
            >
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 bg-purple-600/20 rounded-2xl text-purple-400 border border-purple-500/30">
                  <Palette size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Create AI Image</h3>
                  <p className="text-xs text-slate-400">Generate stunning artwork directly into your chat</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Image Prompt</label>
                  <textarea
                    value={modalPrompt}
                    onChange={(e) => setModalPrompt(e.target.value)}
                    placeholder="e.g. A realistic futuristic cyberpunk city in the mountains of Nepal, 4k..."
                    rows={3}
                    className="w-full bg-[#0f0f18] border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Select Image Model</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'flux', label: 'FLUX (Ultra Detail)' },
                      { id: 'pollinations', label: 'Pollinations AI' },
                      { id: 'flux-realism', label: 'FLUX Realism' },
                      { id: 'sd-xl', label: 'Stable Diffusion XL' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setModalModel(m.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                          modalModel === m.id
                            ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-md shadow-purple-600/10'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Quick Prompt Ideas</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Cyberpunk city at sunset',
                      'Himalayan peaks with aurora borealis',
                      'Cinematic fantasy dragon in cave',
                      'Hyper-realistic futuristic hypercar',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setModalPrompt(preset)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-purple-500/20 hover:text-purple-300 border border-white/5 rounded-lg text-[11px] text-slate-400 transition-colors"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsImageModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!modalPrompt.trim()) return;
                      const cmd = modalModel !== 'flux' 
                        ? `/imagine --model=${modalModel} ${modalPrompt.trim()}`
                        : `/imagine ${modalPrompt.trim()}`;
                      setIsImageModalOpen(false);
                      setModalPrompt('');
                      void send(cmd);
                    }}
                    disabled={!modalPrompt.trim() || sending}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate Image
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
