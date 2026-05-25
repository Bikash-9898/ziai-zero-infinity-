// src/components/image/ImageTab.tsx
import { useCallback, useEffect, useRef } from 'react';
import { useImageStore } from '@/store/useImageStore';
import ImagePromptInput from './ImagePromptInput';
import { Download, AlertCircle, Sparkles, Trash2 } from 'lucide-react';

export default function ImageTab() {
  const {
    history,
    status,
    error,
    activeSessionId,
    deleteImage,
  } = useImageStore();

  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever session images or status changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, status, activeSessionId]);

  const handleDownload = useCallback((url: string) => {
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date().getTime();
    a.download = `generated-${ts}.png`;
    a.click();
  }, []);

  // Only show images belonging to the active session
  const sessionImages = [...history]
    .filter(img => img.sessionId === activeSessionId)
    .reverse();

  const isEmpty =
    sessionImages.length === 0 &&
    status !== 'generating' &&
    status !== 'error';

  return (
    <div className="flex-1 flex flex-col min-h-0">

      {/* Scrollable results area */}
      <div className="flex-1 overflow-y-auto py-6 px-4
        [&::-webkit-scrollbar]:w-1
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-purple-500/30
        [&::-webkit-scrollbar-thumb]:rounded-full
        hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/60">
        <div className="max-w-3xl mx-auto w-full space-y-8">

          {/* Empty state */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-purple-600 to-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                <Sparkles size={22} className="text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-1">Generate an image</h2>
              <p className="text-sm text-slate-500">Describe what you want to see below</p>
            </div>
          )}

          {/* Session images — chat-style layout */}
          {sessionImages.map((img) => (
            <div key={img.id} className="space-y-3">
              {/* User prompt bubble */}
              <div className="flex justify-end">
                <div className="bg-[#2f2f2f] text-slate-200 text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[75%] leading-relaxed">
                  {img.prompt}
                </div>
              </div>
              {/* Generated image */}
              <div className="flex justify-start">
                <div className="group relative rounded-2xl overflow-hidden border border-white/10 max-w-sm w-full">
                  <img src={img.image_url} alt={img.prompt} className="w-full object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDownload(img.image_url)}
                      className="bg-black/60 hover:bg-black/80 rounded-lg p-1.5 text-white"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => deleteImage(img.id)}
                      className="bg-black/60 hover:bg-red-600/80 rounded-lg p-1.5 text-white"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Generating skeleton */}
          {status === 'generating' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <div className="bg-[#2f2f2f] text-slate-400 text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[75%] italic">
                  Generating…
                </div>
              </div>
              <div className="flex justify-start">
                <div className="w-72 aspect-square rounded-2xl bg-[#2f2f2f] overflow-hidden relative">
                  <div className="absolute inset-0 bg-linear-to-r from-[#2f2f2f] via-white/5 to-[#2f2f2f] animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="flex items-center gap-3 bg-red-950/30 border border-red-900/50 rounded-2xl p-4">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <p className="text-red-400 text-xs font-mono">
                {typeof error === 'string' ? error : 'Generation failed'}
              </p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Prompt input — always pinned at bottom */}
      <ImagePromptInput />
    </div>
  );
}