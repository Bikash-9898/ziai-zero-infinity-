import { Mic, MicOff, Square, X, Trash2, AlertTriangle } from 'lucide-react';
import { SpeechStatus } from '@/hooks/useSpeechToText';
import AudioWaveform from './AudioWaveform';

// Retained for the read-only badge in SpeechActivePanel. The picker that used
// this list was removed; speech now always runs in the language persisted under
// 'zi_speech_lang' (default 'en-US').
export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'ne-NP', label: 'नेपाली (Nepal)' },
  { code: 'hi-IN', label: 'हिन्दी (India)' },
  { code: 'es-ES', label: 'Español (Spain)' },
  { code: 'fr-FR', label: 'Français (France)' },
  { code: 'de-DE', label: 'Deutsch (Germany)' },
  { code: 'zh-CN', label: '中文 (China)' },
  { code: 'ja-JP', label: '日本語 (Japan)' },
];

interface SpeechActivePanelProps {
  status: SpeechStatus;
  errorMsg: string | null;
  stream: MediaStream | null;
  language: string;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
  onClear: () => void;
}

export function SpeechActivePanel({
  status,
  errorMsg,
  stream,
  language,
  onStart,
  onStop,
  onCancel,
  onClear,
}: SpeechActivePanelProps) {
  const activeLangLabel = SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label || 'Language';

  if (status === 'idle') return null;

  return (
    <div className="p-3 border-b border-white/10 bg-[#1e1e24] rounded-t-2xl flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {status === 'listening' && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-duration-1000"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            {status === 'listening' && 'Listening...'}
            {status === 'processing' && 'Initializing Microphone...'}
            {status === 'error' && 'Error'}
          </span>
          <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-400 font-medium">
            {activeLangLabel}
          </span>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors"
            title="Clear text"
            aria-label="Clear speech output"
          >
            <Trash2 size={14} />
          </button>

          {status === 'listening' ? (
            <button
              onClick={onStop}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-[11px] font-semibold transition-all border border-red-500/30"
              title="Stop and keep text"
              aria-label="Stop recording"
            >
              <Square size={10} fill="currentColor" />
              <span>Done</span>
            </button>
          ) : (
            status !== 'processing' && (
              <button
                onClick={onStart}
                className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[11px] font-semibold transition-all shadow"
                title="Resume recording"
                aria-label="Resume listening"
              >
                <Mic size={10} />
                <span>Resume</span>
              </button>
            )
          )}

          <button
            onClick={onCancel}
            className="p-1 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-400 transition-colors"
            title="Cancel recording"
            aria-label="Cancel recording"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Visual Audio Waveform */}
      {status === 'listening' && stream && (
        <AudioWaveform stream={stream} isActive={status === 'listening'} />
      )}

      {/* Error Message */}
      {status === 'error' && errorMsg && (
        <div className="flex items-start gap-2 p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          <AlertTriangle size={14} className="shrink-0 text-red-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-200">Recording Error</p>
            <p className="mt-0.5 leading-normal text-red-300">{errorMsg}</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface SpeechRecognitionToggleProps {
  status: SpeechStatus;
  onStart: () => void;
  onStop: () => void;
}

export default function SpeechRecognitionToggle({
  status,
  onStart,
  onStop,
}: SpeechRecognitionToggleProps) {
  return (
    <div className="relative flex items-center shrink-0">
      <button
        onClick={() => {
          if (status === 'listening') {
            onStop();
          } else {
            onStart();
          }
        }}
        type="button"
        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 relative ${
          status === 'listening'
            ? 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/30'
            : 'text-slate-400 hover:bg-white/10 hover:text-white'
        }`}
        title={status === 'listening' ? 'Stop Listening' : 'Voice Input (Speech-to-Text)'}
        aria-label={status === 'listening' ? 'Stop voice input' : 'Start voice input'}
        aria-pressed={status === 'listening'}
      >
        {status === 'listening' ? <MicOff size={18} /> : <Mic size={18} />}
      </button>
    </div>
  );
}
