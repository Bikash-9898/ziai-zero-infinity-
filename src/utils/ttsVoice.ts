export type VoiceGender = 'male' | 'female';

export const TTS_VOICE_GENDER_KEY = 'zi_tts_voice_gender';

const MALE_KEYWORDS = [
  'male',
  'david',
  'mark',
  'james',
  'daniel',
  'paul',
  'george',
  'rishi',
  'guy',
  'alex',
  'tom',
  'fred',
  'ralph',
  'bruce',
  'aaron',
  'arthur',
  'gordon',
  'richard',
  'christopher',
  'matthew',
  'ryan',
  'brian',
  'sean',
  'william',
  'steven',
  'michael',
  'andrew',
  'benjamin',
  'nathan',
  'jason',
];

const FEMALE_KEYWORDS = [
  'female',
  'zira',
  'samantha',
  'karen',
  'victoria',
  'susan',
  'linda',
  'heera',
  'priya',
  'aria',
  'jenny',
  'hazel',
  'catherine',
  'moira',
  'tessa',
  'veena',
  'kanya',
  'sonia',
  'natasha',
  'emily',
  'sarah',
  'laura',
  'anna',
  'helen',
  'michelle',
  'olivia',
  'sophia',
  'nancy',
  'heera',
  'neerja',
];

export const VOICE_START_GREETING =
  "Hello! I'm K, your AI assistant. How can I help you today?";

function matchesGender(voice: SpeechSynthesisVoice, gender: VoiceGender): boolean {
  const name = voice.name.toLowerCase();
  const keywords = gender === 'male' ? MALE_KEYWORDS : FEMALE_KEYWORDS;
  return keywords.some((keyword) => name.includes(keyword));
}

function matchesLanguage(voice: SpeechSynthesisVoice, lang: string): boolean {
  const langPrefix = lang.split('-')[0].toLowerCase();
  const voiceLang = voice.lang.toLowerCase();
  return voiceLang === lang.toLowerCase() || voiceLang.startsWith(`${langPrefix}-`);
}

function scoreVoice(voice: SpeechSynthesisVoice, gender: VoiceGender, lang: string): number {
  let score = 0;
  if (matchesLanguage(voice, lang)) score += 10;
  if (matchesGender(voice, gender)) score += 20;
  if (voice.localService) score += 5;
  if (voice.default) score += 1;
  return score;
}

export function pickVoiceByGender(
  voices: SpeechSynthesisVoice[],
  gender: VoiceGender,
  lang = 'en-US',
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  const ranked = voices
    .map((voice) => ({ voice, score: scoreVoice(voice, gender, lang) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  if (ranked.length > 0) return ranked[0].voice;

  const langVoices = voices.filter((voice) => matchesLanguage(voice, lang));
  if (langVoices.length > 0) return langVoices[0];

  return voices[0];
}

export function loadSpeechVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve([]);
      return;
    }

    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }

    const finish = () => {
      synth.removeEventListener('voiceschanged', finish);
      resolve(synth.getVoices());
    };

    synth.addEventListener('voiceschanged', finish);
    setTimeout(finish, 800);
  });
}

export function getStoredVoiceGender(): VoiceGender {
  const stored = localStorage.getItem(TTS_VOICE_GENDER_KEY);
  return stored === 'male' ? 'male' : 'female';
}

export function storeVoiceGender(gender: VoiceGender) {
  localStorage.setItem(TTS_VOICE_GENDER_KEY, gender);
}
