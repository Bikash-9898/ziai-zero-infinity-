import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Loader2, Mic, AlertTriangle, Volume2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useTextToSpeechVoice } from '@/hooks/useTextToSpeechVoice';
import { useChatStore } from '@/store/useChatStore';
import { VOICE_START_GREETING } from '@/utils/ttsVoice';
import AudioWaveform from './AudioWaveform';

interface VoiceConversationModeProps {
  isOpen: boolean;
  onClose: () => void;
}

type VoicePhase = 'listening' | 'thinking' | 'speaking' | 'error' | 'interrupted';

const STOP_COMMANDS = /^(?:stop(?: (?:talking|please|now))?|please stop|pause|enough|cancel|be quiet|रोक|बन्द|बस|रुको|बंद करो|चुप)$/i;

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

export default function VoiceConversationMode({ isOpen, onClose }: VoiceConversationModeProps) {
  const { send, sending, messages } = useChatStore();
  const [conversationStarted, setConversationStarted] = useState(false);
  const [phase, setPhase] = useState<VoicePhase>('listening');
  const [transcript, setTranscript] = useState('');
  const [spokenText, setSpokenText] = useState('');

  const phaseRef = useRef<VoicePhase>('listening');
  const questionQueueRef = useRef<string[]>([]);
  const pendingReplyRef = useRef(false);
  const prevSendingRef = useRef(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const responseGenRef = useRef(0);
  const speakingGenRef = useRef(0);

  const startRef = useRef<(() => void) | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const pauseRef = useRef<(() => void) | null>(null);
  const resumeRef = useRef<(() => Promise<void>) | null>(null);
  const interruptedRef = useRef(false);
  const languageRef = useRef('en-US');
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  phaseRef.current = phase;

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
  }, []);

  const handleInterrupt = useCallback(() => {
    interruptedRef.current = true;
    setPhase('interrupted');
    stopSpeaking();
    pauseRef.current?.();
    setSpokenText('');
    setTranscript('');

    window.setTimeout(() => {
      setPhase('listening');
      void resumeRef.current?.();
    }, 220);
  }, [stopSpeaking]);

  const flushQuestionQueue = useCallback(() => {
    if (sending || questionQueueRef.current.length === 0) return;
    const next = questionQueueRef.current.shift()!;
    pendingReplyRef.current = true;
    responseGenRef.current += 1;
    setPhase('thinking');
    void send(next);
  }, [send, sending]);

  const submitQuestion = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      stopSpeaking();
      setTranscript(trimmed);
      questionQueueRef.current.push(trimmed);
      flushQuestionQueue();
    },
    [flushQuestionQueue, stopSpeaking],
  );

  const handleTranscriptChange = useCallback((text: string) => {
    setTranscript(text);
  }, []);

  const handleInterruptionCheck = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return false;

    const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');
    if (!STOP_COMMANDS.test(normalized)) return false;

    handleInterrupt();
    return true;
  }, [handleInterrupt]);

  const handleFinalTranscript = useCallback(
    (text: string) => {
      if (handleInterruptionCheck(text)) return;
      submitQuestion(text);
    },
    [handleInterruptionCheck, submitQuestion],
  );

  const {
    status: speechStatus,
    errorMsg: speechErrorMsg,
    stream,
    language,
    start,
    pause,
    resume,
    cancel,
  } = useSpeechToText({
    onTranscriptChange: handleTranscriptChange,
    onFinalTranscript: handleFinalTranscript,
    silenceMs: 1800,
    continuousListen: true,
  });

  startRef.current = start;
  cancelRef.current = cancel;
  pauseRef.current = pause;
  resumeRef.current = resume;
  languageRef.current = language;

  const {
    selectedVoice,
    ready: voicesReady,
    previewVoice,
    stopPreview,
  } = useTextToSpeechVoice(language);

  selectedVoiceRef.current = selectedVoice;

  const speakText = useCallback(
    (text: string, generation: number) => {
      if (!window.speechSynthesis) {
        setPhase('listening');
        void resumeRef.current?.();
        return;
      }

      stopSpeaking();
      setPhase('speaking');
      setSpokenText(text);
      setTranscript('');

      const utterance = new SpeechSynthesisUtterance(stripMarkdown(text));
      utterance.lang = languageRef.current;
      utterance.rate = 1;
      if (selectedVoiceRef.current) {
        utterance.voice = selectedVoiceRef.current;
      }
      const finishSpeaking = () => {
        utteranceRef.current = null;
        if (speakingGenRef.current !== generation) return;
        if (interruptedRef.current) {
          interruptedRef.current = false;
          setPhase('listening');
          setSpokenText('');
          return;
        }
        setPhase('listening');
        setSpokenText('');
        void resumeRef.current?.();
      };
      utterance.onend = finishSpeaking;
      utterance.onerror = finishSpeaking;
      speakingGenRef.current = generation;
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [stopSpeaking],
  );

  useEffect(() => {
    if (!isOpen) return;

    if (prevSendingRef.current && !sending) {
      if (questionQueueRef.current.length > 0) {
        pendingReplyRef.current = false;
        flushQuestionQueue();
      } else if (pendingReplyRef.current) {
        pendingReplyRef.current = false;
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.role === 'assistant') {
          const gen = responseGenRef.current;
          speakText(lastMsg.content, gen);
        } else {
          setPhase('listening');
          void resumeRef.current?.();
        }
      }
    }

    if (sending && questionQueueRef.current.length === 0) {
      setPhase('thinking');
      pauseRef.current?.();
    }

    prevSendingRef.current = sending;
  }, [isOpen, sending, messages, speakText, flushQuestionQueue]);

  useEffect(() => {
    if (sending) return;
    flushQuestionQueue();
  }, [sending, flushQuestionQueue]);

  useEffect(() => {
    if (!isOpen) {
      cancelRef.current?.();
      stopSpeaking();
      stopPreview();
      questionQueueRef.current = [];
      pendingReplyRef.current = false;
      prevSendingRef.current = false;
      responseGenRef.current = 0;
      speakingGenRef.current = 0;
      interruptedRef.current = false;
      setConversationStarted(false);
      setPhase('listening');
      setTranscript('');
      setSpokenText('');
      return;
    }

    setConversationStarted(false);
    setPhase('listening');
    setTranscript('');
    setSpokenText('');
    interruptedRef.current = false;
    questionQueueRef.current = [];
    pendingReplyRef.current = false;
  }, [isOpen, stopSpeaking, stopPreview]);

  useEffect(() => {
    if (!isOpen || !conversationStarted) return;

    // Mic starts after the welcome greeting finishes (see handleStartConversation).
    if (window.speechSynthesis) return;

    const timer = setTimeout(() => {
      void startRef.current?.();
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen, conversationStarted]);

  useEffect(() => {
    if (speechStatus === 'error') {
      setPhase('error');
    } else if (phase === 'error' && speechStatus === 'listening') {
      setPhase('listening');
    }
  }, [speechStatus, phase]);

  const handleClose = () => {
    cancelRef.current?.();
    stopSpeaking();
    stopPreview();
    onClose();
  };

  const handleStartConversation = () => {
    stopPreview();
    setConversationStarted(true);

    const beginListening = () => {
      setPhase('listening');
      setSpokenText('');
      void startRef.current?.();
    };

    if (!window.speechSynthesis) {
      beginListening();
      return;
    }

    setPhase('speaking');
    setSpokenText(VOICE_START_GREETING);

    const utterance = new SpeechSynthesisUtterance(VOICE_START_GREETING);
    utterance.lang = languageRef.current;
    utterance.rate = 1;
    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
    }
    utterance.onend = () => {
      utteranceRef.current = null;
      beginListening();
    };
    utterance.onerror = () => {
      utteranceRef.current = null;
      beginListening();
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePreviewVoice = () => {
    previewVoice();
  };

  const isMicActive = speechStatus === 'listening' || speechStatus === 'processing';

  const phaseLabel =
    phase === 'interrupted'
      ? 'Interrupted — waiting for your next command'
      : phase === 'listening'
        ? isMicActive
          ? 'Listening — ask anything'
          : 'Starting microphone...'
        : phase === 'thinking'
          ? 'Searching & thinking...'
          : phase === 'speaking'
            ? 'Answering — I stay ready for your next sentence'
            : 'Error';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={handleClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-lg flex flex-col items-center"
          >
            <button
              onClick={handleClose}
              className="absolute -top-2 right-0 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close voice conversation"
            >
              <X size={20} />
            </button>

            <div className="mb-8 flex flex-col items-center gap-2">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                  !conversationStarted
                    ? 'bg-purple-600/20 ring-2 ring-purple-500/50'
                    : isMicActive
                      ? 'bg-red-500/20 ring-2 ring-red-500/50 shadow-lg shadow-red-500/20'
                      : phase === 'thinking'
                        ? 'bg-purple-600/20 ring-2 ring-purple-500/50'
                        : phase === 'speaking'
                          ? 'bg-blue-500/20 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20'
                          : phase === 'interrupted'
                            ? 'bg-amber-500/20 ring-2 ring-amber-400/50 shadow-lg shadow-amber-400/20'
                            : 'bg-white/5 ring-2 ring-white/10'
                }`}
              >
                {!conversationStarted ? (
                  <Volume2 size={28} className="text-purple-400" />
                ) : phase === 'thinking' ? (
                  <Loader2 size={28} className="text-purple-400 animate-spin" />
                ) : phase === 'interrupted' ? (
                  <AlertTriangle size={28} className="text-amber-400" />
                ) : (
                  <Mic
                    size={28}
                    className={
                      isMicActive
                        ? 'text-red-400'
                        : phase === 'speaking'
                          ? 'text-blue-400'
                          : 'text-slate-400'
                    }
                  />
                )}
              </div>

              <h2 className="text-xl font-semibold text-white tracking-tight">
                {conversationStarted ? 'Voice Conversation' : 'Start Conversation'}
              </h2>
              <p className="text-sm text-slate-400 text-center">
                {conversationStarted
                  ? phaseLabel
                  : 'Tap start and speak naturally — the assistant will listen and pause automatically.'}
              </p>
            </div>

            {!conversationStarted ? (
              <>
                <div className="w-full mb-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Voice</p>
                  <p className="mt-1 text-sm text-white">
                    {selectedVoice?.name ?? (voicesReady ? 'Default system voice' : 'Loading voices...')}
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3">
                  <button
                    type="button"
                    onClick={handlePreviewVoice}
                    disabled={!voicesReady}
                    className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-200 transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Volume2 size={16} />
                    Preview voice
                  </button>

                  <button
                    type="button"
                    onClick={handleStartConversation}
                    disabled={!voicesReady}
                    className="rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Start conversation
                  </button>
                </div>
              </>
            ) : (
              <>
            <div className="w-full mb-6">
              {isMicActive && stream ? (
                <AudioWaveform stream={stream} isActive />
              ) : phase === 'speaking' ? (
                <div className="w-full h-14 flex items-center justify-center bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex gap-1 items-end h-6">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-blue-400 rounded-full"
                        animate={{ height: ['8px', '24px', '8px'] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="w-full h-14 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl">
                  {phase === 'thinking' && (
                    <Loader2 size={20} className="text-purple-400 animate-spin" />
                  )}
                </div>
              )}
            </div>

            <div className="w-full min-h-[80px] max-h-40 overflow-y-auto custom-scrollbar px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              {phase === 'speaking' && spokenText ? (
                <p className="text-sm text-slate-300 leading-relaxed">{stripMarkdown(spokenText)}</p>
              ) : transcript ? (
                <p className="text-sm text-white leading-relaxed">{transcript}</p>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  {phase === 'thinking'
                    ? 'Using your conversation history to answer...'
                    : phase === 'interrupted'
                      ? 'Interrupted — say something new or continue when ready.'
                      : 'Hands-free mode is on — speak naturally and the assistant will listen automatically.'}
                </p>
              )}
            </div>

            {phase === 'error' && speechErrorMsg && (
              <div className="w-full mt-4 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                <AlertTriangle size={14} className="shrink-0 text-red-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-200">Microphone Error</p>
                  <p className="mt-0.5 leading-normal">{speechErrorMsg}</p>
                </div>
              </div>
            )}

            <div className="mt-8">
              <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-all"
              >
                {conversationStarted ? 'End conversation' : 'Cancel'}
              </button>
            </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
