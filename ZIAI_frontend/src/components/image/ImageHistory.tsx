// image history component
import { useState } from 'react';
import { X } from 'lucide-react';
import type { GeneratedImage } from '@/types/image';

// ← removed useImageStore (not needed here)

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return 'just now';
}

export default function ImageHistory({ images }: { images: GeneratedImage[] }) {
  const [preview, setPreview] = useState<GeneratedImage | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] uppercase tracking-widest font-mono text-slate-600">
            Recent generations
          </span>
          <span className="text-[9px] font-mono text-slate-700">{images.length} images</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
          {images.map(img => (
            <button
              key={img.id}
              onClick={() => setPreview(img)}
              className="group relative rounded-xl overflow-hidden border border-slate-800/60 hover:border-slate-600 transition-all hover:-translate-y-0.5 bg-[#080c14]"
            >
              <img
                src={img.image_url}   
                alt={img.prompt}
                className="w-full aspect-square object-cover"
              />
              <div className="absolute inset-0 bg-[#05070a]/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                <p className="text-[8px] font-mono text-slate-400 line-clamp-2 leading-tight">
                  {img.prompt}
                </p>
                <div className="flex justify-between mt-1">
                  <span className="text-[7px] font-mono text-slate-600">{img.model}</span>
                  <span className="text-[7px] font-mono text-slate-600">{timeAgo(img.created_at)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-[#080c14] border border-slate-800 rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <img src={preview.image_url} alt={preview.prompt} className="w-full" /> {/* ← fixed */}
            <div className="p-4">
              <p className="text-xs font-mono text-slate-400 leading-relaxed">{preview.prompt}</p>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] font-mono text-slate-600">{preview.model}</span>
                <span className="text-[10px] font-mono text-slate-600">{timeAgo(preview.created_at)}</span>
              </div>
            </div>
            <button
              onClick={() => setPreview(null)}
              className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-full p-1.5 text-slate-400 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}