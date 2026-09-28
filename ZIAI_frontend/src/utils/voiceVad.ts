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
  let silenceNotified = false;

  const update = (amplitude: number) => {
    const isSpeech = amplitude >= speechThreshold;

    if (isSpeech) {
      silenceStartedAt = null;
      silenceNotified = false;
      if (state !== 'speaking') {
        state = 'speaking';
        onSpeechDetected?.();
      }
      return { state, isSpeech };
    }

    // Below the threshold. Only report silence once it has actually lasted
    // `silenceMs` — firing on the first quiet frame cuts the user off
    // mid-sentence, because amplitude dips momentarily on every pause between
    // words, plosive and breath.
    if (state === 'speaking' || silenceStartedAt !== null) {
      if (silenceStartedAt === null) silenceStartedAt = Date.now();
      if (!silenceNotified && Date.now() - silenceStartedAt >= silenceMs) {
        silenceNotified = true;
        state = 'silence';
        onSilenceDetected?.();
      }
      return { state, isSpeech };
    }

    return { state, isSpeech };
  };

  const getState = () => state;
  const reset = () => {
    state = 'idle';
    silenceStartedAt = null;
    silenceNotified = false;
  };

  return { update, getState, reset };
}
