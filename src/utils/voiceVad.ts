export interface VoiceActivityControllerOptions {
  speechThreshold?: number;
  silenceMs?: number;
  onSpeechDetected?: () => void;
  onSilenceDetected?: () => void;
}

export function createVoiceActivityController({
  speechThreshold = 0.18,
  silenceMs = 1200,
  onSpeechDetected,
  onSilenceDetected,
}: VoiceActivityControllerOptions = {}) {
  let state: 'idle' | 'speaking' | 'silence' = 'idle';
  let silenceStartedAt: number | null = null;

  const update = (amplitude: number) => {
    const isSpeech = amplitude >= speechThreshold;

    if (isSpeech) {
      silenceStartedAt = null;
      if (state !== 'speaking') {
        state = 'speaking';
        onSpeechDetected?.();
      }
      return { state, isSpeech };
    }

    if (state === 'speaking') {
      silenceStartedAt = Date.now();
      state = 'silence';
      onSilenceDetected?.();
      return { state, isSpeech };
    }

    if (silenceStartedAt && Date.now() - silenceStartedAt >= silenceMs) {
      state = 'idle';
    }

    return { state, isSpeech };
  };

  const getState = () => state;
  const reset = () => {
    state = 'idle';
    silenceStartedAt = null;
  };

  return { update, getState, reset };
}
