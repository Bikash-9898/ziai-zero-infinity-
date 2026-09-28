import { useState, useEffect, useRef, useCallback } from 'react';
import { createVoiceActivityController } from '@/utils/voiceVad';

export type SpeechStatus = 'idle' | 'listening' | 'processing' | 'error';

interface UseSpeechToTextProps {
  onTranscriptChange?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  /** Pause length (ms) before an utterance is sent. Default 8000. */
  silenceMs?: number;
  /** Keep the mic open and restart recognition after each utterance. */
  continuousListen?: boolean;
}

export function useSpeechToText({
  onTranscriptChange,
  onFinalTranscript,
  silenceMs = 8000,
  continuousListen = false,
}: UseSpeechToTextProps = {}) {
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('zi_speech_lang') || 'en-US';
  });

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedTranscriptRef = useRef<string>('');
  const activeStreamRef = useRef<MediaStream | null>(null);
  const intentionalStopRef = useRef(false);
  const pausedRef = useRef(false);
  const statusRef = useRef<SpeechStatus>('idle');
  const recognitionActiveRef = useRef(false);
  const retryCountRef = useRef(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const vadFrameRef = useRef<number | null>(null);
  const vadControllerRef = useRef<ReturnType<typeof createVoiceActivityController> | null>(null);
  const vadListeningRef = useRef(false);
  const continuousListenRef = useRef(continuousListen);
  const silenceMsRef = useRef(silenceMs);
  const onTranscriptChangeRef = useRef(onTranscriptChange);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  // Bumped by every stop/pause/cancel/unmount. `startRecognition` awaits
  // getUserMedia, so without this a stop issued while the permission prompt is
  // still open gets overwritten the moment the stream resolves — leaving the
  // mic live and recording while the UI already shows 'idle'.
  const sessionEpochRef = useRef(0);

  continuousListenRef.current = continuousListen;
  silenceMsRef.current = silenceMs;
  onTranscriptChangeRef.current = onTranscriptChange;
  onFinalTranscriptRef.current = onFinalTranscript;

  const stopVadMonitoring = useCallback(() => {
    if (vadFrameRef.current !== null) {
      cancelAnimationFrame(vadFrameRef.current);
      vadFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      void audioContextRef.current.close();
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    vadControllerRef.current = null;
    vadListeningRef.current = false;
  }, []);

  const stopAudioTracks = useCallback(() => {
    stopVadMonitoring();
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
      setStream(null);
    }
  }, [stopVadMonitoring]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }, silenceMsRef.current);
  }, [clearSilenceTimer]);

  const scheduleRecognitionRestart = useCallback(() => {
    clearRestartTimer();
    if (!continuousListenRef.current || pausedRef.current || !activeStreamRef.current) {
      return;
    }

    const retryDelay = retryCountRef.current > 0 ? 500 + retryCountRef.current * 250 : 250;
    restartTimerRef.current = setTimeout(() => {
      retryCountRef.current += 1;
      void startRecognitionRef.current?.(activeStreamRef.current ?? undefined);
    }, retryDelay);
  }, [clearRestartTimer]);

  const attachRecognitionHandlers = useCallback(
    (recognition: any) => {
      recognition.onstart = () => {
        recognitionActiveRef.current = true;
        retryCountRef.current = 0;
        setStatus('listening');
        resetSilenceTimer();
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'aborted' || intentionalStopRef.current) {
          recognitionActiveRef.current = false;
          intentionalStopRef.current = false;
          return;
        }

        if (event.error === 'no-speech' && continuousListenRef.current) {
          clearSilenceTimer();
          return;
        }

        if (event.error === 'network' || event.error === 'audio-capture') {
          recognitionActiveRef.current = false;
          recognitionRef.current = null;
          clearSilenceTimer();
          setStatus('processing');
          setErrorMsg('Speech service is reconnecting. Please keep speaking.');
          scheduleRecognitionRestart();
          return;
        }

        console.error('Speech recognition error:', event.error);
        recognitionActiveRef.current = false;
        recognitionRef.current = null;
        stopAudioTracks();
        clearSilenceTimer();
        setStatus('error');
        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            setErrorMsg('Microphone permission denied. Please allow microphone access in your browser settings.');
            break;
          default:
            setErrorMsg(`Speech recognition error: ${event.error}. Please try again.`);
        }
      };

      recognition.onend = () => {
        clearSilenceTimer();
        recognitionActiveRef.current = false;
        recognitionRef.current = null;

        const transcript = accumulatedTranscriptRef.current.trim();
        accumulatedTranscriptRef.current = '';

        if (onFinalTranscriptRef.current && transcript) {
          onFinalTranscriptRef.current(transcript);
        }

        const shouldRestart =
          continuousListenRef.current &&
          !intentionalStopRef.current &&
          !pausedRef.current &&
          activeStreamRef.current;

        intentionalStopRef.current = false;

        if (shouldRestart) {
          scheduleRecognitionRestart();
          return;
        }

        // Keep the mic stream alive while paused so resume() can restart recognition.
        if (pausedRef.current) {
          setStatus('idle');
          return;
        }

        stopAudioTracks();
        setStatus('idle');
      };

      recognition.onresult = (event: any) => {
        resetSilenceTimer();
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          accumulatedTranscriptRef.current += accumulatedTranscriptRef.current
            ? ` ${finalTranscript}`
            : finalTranscript;
        }

        const currentText =
          accumulatedTranscriptRef.current +
          (interimTranscript
            ? `${accumulatedTranscriptRef.current ? ' ' : ''}${interimTranscript}`
            : '');

        onTranscriptChangeRef.current?.(currentText);
      };
    },
    [clearSilenceTimer, resetSilenceTimer, scheduleRecognitionRestart, stopAudioTracks],
  );

  const startRecognitionRef = useRef<(existingStream?: MediaStream) => Promise<void> | undefined>(undefined);

  const monitorVoiceActivity = useCallback(
    (stream: MediaStream) => {
      if (!stream) return;

      stopVadMonitoring();
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      try {
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const controller = createVoiceActivityController({
          speechThreshold: 0.16,
          // Single source of truth for "how long counts as a pause". This was
          // hardcoded to 900ms while the recognition silence timer uses
          // silenceMs (8s default) — the VAD always won, so dictation was cut
          // off far sooner than the rest of the hook expected.
          silenceMs: silenceMsRef.current,
          onSpeechDetected: () => {
            if (pausedRef.current || !activeStreamRef.current) return;
            if (statusRef.current === 'listening' || statusRef.current === 'processing') return;
            void startRecognitionRef.current?.(activeStreamRef.current);
          },
          onSilenceDetected: () => {
            if (pausedRef.current || !activeStreamRef.current) return;
            if (recognitionRef.current && (statusRef.current === 'listening' || statusRef.current === 'processing')) {
              try {
                recognitionRef.current.stop();
              } catch (e) {
                console.error('Error stopping recognition on silence:', e);
              }
            }
          },
        });

        vadControllerRef.current = controller;
        const buffer = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          analyser.getByteTimeDomainData(buffer);
          let sumSquares = 0;
          for (let i = 0; i < buffer.length; i += 1) {
            const centered = buffer[i] - 128;
            sumSquares += centered * centered;
          }
          const rms = Math.sqrt(sumSquares / buffer.length) / 128;
          const result = controller.update(rms);

          if (result.isSpeech) {
            vadListeningRef.current = true;
          } else if (result.state === 'idle' && vadListeningRef.current) {
            vadListeningRef.current = false;
          }

          vadFrameRef.current = window.requestAnimationFrame(tick);
        };

        vadFrameRef.current = window.requestAnimationFrame(tick);
      } catch (error) {
        console.error('Unable to start voice activity monitoring:', error);
      }
    },
    [stopVadMonitoring],
  );

  const startRecognition = useCallback(
    async (existingStream?: MediaStream) => {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setStatus('error');
        setErrorMsg('Your browser does not support Speech Recognition. Try Chrome, Edge, or Safari.');
        return;
      }

      try {
        if (!existingStream) {
          setStatus('processing');
        }

        const epoch = sessionEpochRef.current;
        let micStream = existingStream ?? null;
        if (!micStream) {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });

          // A stop/cancel landed while we were waiting on the mic. This stream
          // is orphaned — close it rather than starting recognition on it.
          if (sessionEpochRef.current !== epoch) {
            micStream.getTracks().forEach((track) => track.stop());
            return;
          }
        }

        activeStreamRef.current = micStream;
        setStream(micStream);
        monitorVoiceActivity(micStream);

        if (recognitionRef.current && recognitionActiveRef.current) {
          return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;
        attachRecognitionHandlers(recognition);
        recognition.start();
      } catch (err: any) {
        console.error('Microphone access failed:', err);
        stopAudioTracks();
        clearSilenceTimer();
        setStatus('error');
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMsg('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setErrorMsg('No microphone detected. Please plug in a microphone and try again.');
        } else {
          setErrorMsg('Could not access microphone. Please check your system settings.');
        }
      }
    },
    [attachRecognitionHandlers, clearSilenceTimer, language, monitorVoiceActivity, stopAudioTracks],
  );

  startRecognitionRef.current = startRecognition;

  const start = useCallback(async () => {
    setErrorMsg(null);
    intentionalStopRef.current = false;
    pausedRef.current = false;
    accumulatedTranscriptRef.current = '';
    sessionEpochRef.current += 1;
    await startRecognition();
  }, [startRecognition]);

  /** Pause recognition without releasing the mic (e.g. while AI is speaking). */
  const pause = useCallback(() => {
    pausedRef.current = true;
    intentionalStopRef.current = true;
    recognitionActiveRef.current = false;
    sessionEpochRef.current += 1;
    clearSilenceTimer();
    clearRestartTimer();
    accumulatedTranscriptRef.current = '';
    onTranscriptChangeRef.current?.('');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error pausing recognition:', e);
      }
    }

    if (activeStreamRef.current) {
      activeStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
    }

    setStatus('idle');
  }, [clearSilenceTimer]);

  /** Resume recognition after pause. Requires an existing mic stream from start(). */
  const resume = useCallback(async () => {
    if (!pausedRef.current) return;

    const epoch = sessionEpochRef.current;
    pausedRef.current = false;
    intentionalStopRef.current = false;
    recognitionActiveRef.current = false;
    accumulatedTranscriptRef.current = '';
    onTranscriptChangeRef.current?.('');

    if (activeStreamRef.current) {
      activeStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
    }

    // Brief delay helps Chrome restart recognition reliably after pause.
    await new Promise((resolve) => setTimeout(resolve, 150));
    // Cancelled/stopped during the delay — do not resurrect the session.
    if (sessionEpochRef.current !== epoch) return;
    await startRecognition(activeStreamRef.current ?? undefined);
  }, [startRecognition]);

  const stop = useCallback(() => {
    intentionalStopRef.current = !continuousListenRef.current;
    recognitionActiveRef.current = false;
    sessionEpochRef.current += 1;
    clearSilenceTimer();
    clearRestartTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
    if (!continuousListenRef.current) {
      stopAudioTracks();
      setStatus('idle');
    }
  }, [clearSilenceTimer, stopAudioTracks]);

  const cancel = useCallback(() => {
    intentionalStopRef.current = true;
    pausedRef.current = false;
    recognitionActiveRef.current = false;
    sessionEpochRef.current += 1;
    clearSilenceTimer();
    clearRestartTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.error('Error aborting recognition:', e);
      }
    }
    recognitionRef.current = null;
    stopAudioTracks();
    setStatus('idle');
    accumulatedTranscriptRef.current = '';
    onTranscriptChangeRef.current?.('');
  }, [clearSilenceTimer, stopAudioTracks]);

  const updateLanguage = useCallback(
    (newLang: string) => {
      setLanguage(newLang);
      localStorage.setItem('zi_speech_lang', newLang);
      if (status === 'listening' || status === 'processing') {
        intentionalStopRef.current = false;
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
        }
        setTimeout(() => {
          void startRecognition(activeStreamRef.current ?? undefined);
        }, 300);
      }
    },
    [status, startRecognition],
  );

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('zi_speech_lang');
      if (stored && stored !== language) {
        setLanguage(stored);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      sessionEpochRef.current += 1;
      clearSilenceTimer();
      clearRestartTimer();
      intentionalStopRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [language, clearSilenceTimer]);

  return {
    status,
    errorMsg,
    stream,
    language,
    updateLanguage,
    start,
    stop,
    pause,
    resume,
    cancel,
    clearTranscript: () => {
      accumulatedTranscriptRef.current = '';
      onTranscriptChangeRef.current?.('');
    },
  };
}
