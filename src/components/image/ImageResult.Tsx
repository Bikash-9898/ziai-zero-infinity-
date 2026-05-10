// src/components/image/ImageResult.tsx
import { useState } from 'react';
import { Download, RefreshCw, Share2, AlertCircle } from 'lucide-react';
import { useImageStore } from '@/store/useImageStore';

export default function ImageResult() {
  const { status, currentImage, error } = useImageStore();
  const [hovered, setHovered]           = useState(false);

  if (status === 'idle') return null;

  if (status === 'error') {
    return (
      <div className="flex items-center gap-3 bg-red-950/30 border border-red-900/50 rounded-2xl p-4 mb-6">
        <AlertCircle size={16} className="text-red-400 shrink-0" />
        <div>
          <p className="text-red-400 text-xs font-mono font-medium">Generation failed</p>
          <p className="text-red-600 text-[11px] font-mono mt-0.5">
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'generating') {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest font-mono text-blue-400">
            Generating image…
          </span>
        </div>
        <div className="w-full max-w-md aspect-square rounded-2xl bg-slate-900 overflow-hidden relative animate-pulse" />
      </div>
    );
  }

  // ── Download — works for both base64 data URIs and external URLs ──────────
  async function handleDownload() {
    if (!currentImage) return;
    try {
      let url: string;
      if (currentImage.startsWith('data:')) {
        // base64 from HuggingFace — use directly
        url = currentImage;
      } else {
        // external URL (Pollinations / fal.ai) — fetch as blob first
        const blob = await fetch(currentImage).then(r => r.blob());
        url = URL.createObjectURL(blob);
      }
      const a      = document.createElement('a');
      a.href       = url;
      a.download   = `generated-${Date.now()}.png`;
      a.click();
      if (!currentImage.startsWith('data:')) URL.revokeObjectURL(url);
    } catch {
      console.error('Download failed');
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-[10px] uppercase tracking-widest font-mono text-emerald-400">
          Complete
        </span>
      </div>

      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden border border-slate-800/60"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img src={currentImage!} alt="Generated" className="w-full object-cover" />

        <div
          className={`absolute bottom-0 left-0 right-0 p-3 flex gap-2 transition-opacity duration-200 ${
            hovered ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ background: 'linear-gradient(transparent, rgba(5,7,10,0.95))' }}
        >
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg py-2 text-[11px] font-mono text-slate-300 transition-all"
          >
            <Download size={11} /> Save
          </button>
          {/* Remix: pre-fills the prompt — wiring to store needs imageStore to expose setPrompt or similar */}
          <button
            title="Coming soon"
            className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg py-2 text-[11px] font-mono text-slate-600 cursor-not-allowed"
          >
            <RefreshCw size={11} /> Remix
          </button>
          <button className="flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-2 text-slate-400 transition-all">
            <Share2 size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
