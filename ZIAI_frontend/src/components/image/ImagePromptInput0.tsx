// import { useState } from 'react';
// import { Zap } from 'lucide-react';
// import { useImageStore } from '@/store/useImageStore';
// import { useAuth } from '@/context/useAuth';
// import ImageModelSelector from './ImageModelSelector';
// import { generateImage } from '@/services/imageService';

// const STYLE_TAGS = ['Photorealistic', 'Cinematic', 'Anime', 'Oil Painting', '3D Render', 'Pixel Art'];

// const RATIOS = [
//   { label: '1:1',  w: 1024, h: 1024 },
//   { label: '16:9', w: 1280, h: 720  },
//   { label: '9:16', w: 720,  h: 1280 },
// ];

// export default function ImagePromptInput() {
//   const { generate, status } = useImageStore();
//   const { user } = useAuth();                        // ← get user here to debug
//   const [prompt, setPrompt]             = useState('');
//   const [negPrompt, setNegPrompt]       = useState('');
//   const [selectedTags, setSelectedTags] = useState<string[]>([]);
//   const [model, setModel]               = useState('');
//   const [ratio, setRatio]               = useState(RATIOS[0]);
//   const [showNeg, setShowNeg]           = useState(false);
//   const isGenerating = status === 'generating';

//   function toggleTag(tag: string) {
//     setSelectedTags(prev =>
//       prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
//     );
//   }

//   function buildPrompt() {
//     const tags = selectedTags.join(', ');
//     return tags ? `${prompt}, ${tags}` : prompt;
//   }

//   async function handleGenerate() {
//     // ── debug logs — remove after it works ──
//     console.log('user object:', user);
//     console.log('prompt:', prompt);
//     console.log('model:', model);
//     console.log('status:', status);
//     // ────────────────────────────────────────

//     if (!prompt.trim()) {
//       console.log('BLOCKED: empty prompt');
//       return;
//     }
//     if (isGenerating) {
//       console.log('BLOCKED: already generating');
//       return;
//     }

//     // console.log('calling generate...');
//     // try {
//     //   await generate({
//     //     prompt: buildPrompt(),
//     //     negativePrompt: negPrompt || undefined,
//     //     model,
//     //     width: ratio.w,
//     //     height: ratio.h,
//     //   });
//     //   console.log('generate completed');
//     // } catch (err) {
//     //   console.error('generate threw error:', err);
//     // }

//     try {
//       console.log('calling generate...');

//       const result = await generateImage(opts, user.id);

//       setCurrentImage(result);
//       setHistory(prev => [result, ...prev]);
//       setStatus('success');

//       console.log('generate completed');
//     } catch (err: unknown) {
//       console.error('generate failed:', err);

//       const message = err instanceof Error ? err.message : 'Generation failed';

//       setError(message);
//       setStatus('error');
//     }
//   }

//   return (
//     <div className="shrink-0 border-b border-slate-800/50 p-4">
//       <div className="max-w-4xl mx-auto bg-[#080c14] border border-slate-800/60 rounded-2xl p-4">

//         {/* Main prompt */}
//         <textarea
//           rows={3}
//           value={prompt}
//           onChange={e => setPrompt(e.target.value)}
//           placeholder="Describe your image… e.g. 'A cyberpunk city at dusk, neon reflections on wet streets, cinematic'"
//           className="w-full bg-transparent text-slate-200 text-sm font-mono resize-none outline-none placeholder-slate-700 leading-relaxed"
//         />

//         {/* Style tags */}
//         <div className="flex flex-wrap gap-2 mt-3">
//           <span className="text-[9px] uppercase tracking-widest text-slate-600 self-center mr-1">Style</span>
//           {STYLE_TAGS.map(tag => (
//             <button
//               key={tag}
//               onClick={() => toggleTag(tag)}
//               className={`px-2 py-1 rounded text-[10px] font-mono border transition-all ${
//                 selectedTags.includes(tag)
//                   ? 'bg-blue-950 border-blue-600 text-blue-300'
//                   : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'
//               }`}
//             >
//               {tag}
//             </button>
//           ))}
//         </div>

//         {/* Controls */}
//         <div className="grid grid-cols-3 gap-3 mt-4">
//           {/* Model */}
//           <div>
//             <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-1.5">Model</p>
//             <ImageModelSelector value={model} onChange={setModel} />
//           </div>

//           {/* Aspect ratio */}
//           <div>
//             <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-1.5">Aspect Ratio</p>
//             <div className="flex gap-1">
//               {RATIOS.map(r => (
//                 <button
//                   key={r.label}
//                   onClick={() => setRatio(r)}
//                   className={`flex-1 py-2 rounded-lg text-[11px] font-mono border transition-all ${
//                     ratio.label === r.label
//                       ? 'bg-blue-950 border-blue-600 text-blue-300'
//                       : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'
//                   }`}
//                 >
//                   {r.label}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Negative prompt toggle */}
//           <div>
//             <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-1.5">Negative Prompt</p>
//             <button
//               onClick={() => setShowNeg(v => !v)}
//               className={`w-full py-2 rounded-lg text-[11px] font-mono border transition-all ${
//                 showNeg
//                   ? 'bg-slate-800 border-slate-600 text-slate-300'
//                   : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-700'
//               }`}
//             >
//               {showNeg ? 'Hide' : 'Add negative…'}
//             </button>
//           </div>
//         </div>

//         {/* Negative prompt input */}
//         {showNeg && (
//           <textarea
//             rows={1}
//             value={negPrompt}
//             onChange={e => setNegPrompt(e.target.value)}
//             placeholder="e.g. blurry, ugly, watermark, text, low quality…"
//             className="w-full mt-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-400 text-[12px] font-mono px-4 py-3 resize-none outline-none placeholder-slate-700"
//           />
//         )}

//         {/* Footer row */}
//         <div className="flex items-center justify-between mt-4">
//           <span className="text-[10px] font-mono text-slate-700">1.0 credit per generation</span>
//           <button
//             onClick={handleGenerate}
//             disabled={isGenerating}
//             className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all"
//           >
//             <Zap size={13} />
//             {isGenerating ? 'GENERATING…' : 'GENERATE'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// function setCurrentImage(result: any) {
//   throw new Error('Function not implemented.');
// }
