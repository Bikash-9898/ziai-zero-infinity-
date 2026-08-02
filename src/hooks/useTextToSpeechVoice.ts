import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getStoredVoiceGender,
  loadSpeechVoices,
  pickVoiceByGender,
  storeVoiceGender,
  type VoiceGender,
} from '@/utils/ttsVoice';

import { VOICE_START_GREETING } from '@/utils/ttsVoice';

const PREVIEW_TEXT = VOICE_START_GREETING;

export function useTextToSpeechVoice(lang: string) {
  const [gender, setGenderState] = useState<VoiceGender>(getStoredVoiceGender);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ready, setReady] = useState(false);
  const previewUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    let active = true;

    void loadSpeechVoices().then((loaded) => {
      if (!active) return;
      setVoices(loaded);
      setReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  const selectedVoice = useMemo(
    () => pickVoiceByGender(voices, gender, lang),
    [voices, gender, lang],
  );

  const setGender = useCallback((next: VoiceGender) => {
    setGenderState(next);
    storeVoiceGender(next);
  }, []);

  const stopPreview = useCallback(() => {
    window.speechSynthesis?.cancel();
    previewUtteranceRef.current = null;
  }, []);

  const previewVoice = useCallback(
    (sampleText = PREVIEW_TEXT, voiceOverride?: SpeechSynthesisVoice | null) => {
      if (!window.speechSynthesis) return;

      stopPreview();

      const utterance = new SpeechSynthesisUtterance(sampleText);
      utterance.lang = lang;
      utterance.rate = 1;
      utterance.voice = voiceOverride ?? selectedVoice;
      previewUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [lang, selectedVoice, stopPreview],
  );

  useEffect(() => () => stopPreview(), [stopPreview]);

  return {
    gender,
    setGender,
    voices,
    selectedVoice,
    ready,
    previewVoice,
    stopPreview,
  };
}
