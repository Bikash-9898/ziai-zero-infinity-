import { ImageIcon } from 'lucide-react';
import { useImageStore } from '@/store/useImageStore';

export function ImageSidebarHistory() {
  const { history, status } = useImageStore();

  if (status === 'generating') {
    return (
      <div className="text-center py-6">
        <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-[10px] text-slate-600 font-mono">Generating…</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <ImageIcon size={24} className="text-slate-700 mx-auto mb-2" />
        <p className="text-[11px] text-slate-600 font-mono">No generations yet</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-slate-600 font-mono mb-2 px-1">
        Recent Images
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {history.slice(0, 12).map(img => (
          <div
            key={img.id}
            className="aspect-square rounded-lg overflow-hidden border border-slate-800/60 hover:border-slate-600 transition-all cursor-pointer"
            title={img.prompt}
          >
            <img
              src={img.image_url}
              alt={img.prompt}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}