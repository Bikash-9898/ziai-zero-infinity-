// src/components/image/ImagePromptInput.tsx
import { useState } from 'react';
import { Zap } from 'lucide-react';
import { useImageStore } from '@/store/useImageStore';
import ImageModelSelector from './ImageModelSelector';
import type { ImageModel } from '@/types/image';

const STYLE_TAGS = ['Photorealistic', 'Cinematic', 'Anime', 'Oil Painting', '3D Render', 'Pixel Art'];

const RATIOS = [
  { label: '1:1',  w: 1024, h: 1024 },
  { label: '16:9', w: 1280, h: 720  },
  { label: '9:16', w: 720,  h: 1280 },
];

export default function ImagePromptInput() {
  const { generate, status }            = useImageStore();
  const [prompt, setPrompt]             = useState('');
  const [negPrompt, setNegPrompt]       = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [model, setModel]               = useState('flux');
  const [ratio, setRatio]               = useState(RATIOS[0]);
  const [showNeg, setShowNeg]           = useState(false);
  const [models, setModels]             = useState<ImageModel[]>([]);

  const isGenerating    = status === 'generating';
  // Dynamic credits from whichever model is selected — falls back to 1.0
  const selectedCredits = models.find(m => m.id === model)?.credits_per_image ?? 1.0;

  function toggleTag(tag: string) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  function buildPrompt() {
    const tags = selectedTags.join(', ');
    return tags ? `${prompt}, ${tags}` : prompt;
  }

  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return;
    try {
      await generate({
        prompt:         buildPrompt(),
        negativePrompt: negPrompt || undefined,
        model,
        width:          ratio.w,
        height:         ratio.h,
      });
      // Prompt intentionally NOT cleared — lets user tweak and re-generate
    } catch (err) {
      console.error('generate error:', err);
    }
  }

  return (
    <div className="shrink-0 border-b border-white/5 p-4">
      <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-4">

        {/* Main prompt textarea — at top */}
        <textarea
          rows={3}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleGenerate(); } }}
          placeholder="Describe your image… e.g. 'A cyberpunk city at dusk, neon reflections on wet streets, cinematic'"
          className="w-full bg-transparent text-slate-200 text-sm font-mono resize-none outline-none placeholder-slate-700 leading-relaxed"
        />

        {/* Style tags — multi-select */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-[9px] uppercase tracking-widest text-slate-600 self-center mr-1">Style</span>
          {STYLE_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-2 py-1 rounded text-[10px] font-mono border transition-all ${
                selectedTags.includes(tag)
                  ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                  : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Controls — 3-column grid */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-1.5">Model</p>
            <ImageModelSelector
              value={model}
              onChange={setModel}
              onModelsLoaded={setModels}
            />
          </div>

          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-1.5">Aspect Ratio</p>
            <div className="flex gap-1">
              {RATIOS.map(r => (
                <button
                  key={r.label}
                  onClick={() => setRatio(r)}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-mono border transition-all ${
                    ratio.label === r.label
                      ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                      : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-1.5">Negative Prompt</p>
            <button
              onClick={() => setShowNeg(v => !v)}
              className={`w-full py-2 rounded-lg text-[11px] font-mono border transition-all ${
                showNeg
                  ? 'bg-white/5 border-white/20 text-slate-300'
                  : 'bg-white/5 border-white/10 text-slate-600 hover:border-white/20'
              }`}
            >
              {showNeg ? 'Hide' : 'Add negative…'}
            </button>
          </div>
        </div>

        {/* Negative prompt textarea */}
        {showNeg && (
          <textarea
            rows={1}
            value={negPrompt}
            onChange={e => setNegPrompt(e.target.value)}
            placeholder="e.g. blurry, ugly, watermark, text, low quality…"
            className="w-full mt-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 text-[12px] font-mono px-4 py-3 resize-none outline-none placeholder-slate-700 focus:border-purple-500/30"
          />
        )}

        {/* Footer row — dynamic credits + generate button */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-[10px] font-mono text-slate-700">
            {selectedCredits} credit per generation
          </span>
          <button
            onClick={() => void handleGenerate()}
            disabled={isGenerating || !prompt.trim()}
            className="flex items-center gap-2 bg-linear-to-r from-purple-600 to-blue-500 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all"
          >
            <Zap size={13} />
            {isGenerating ? 'GENERATING…' : 'GENERATE'}
          </button>
        </div>
      </div>
    </div>
  );
}
