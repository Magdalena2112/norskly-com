/**
 * Pronunciation module — shared types, category + activity-type registry and
 * audio helpers. Content is per-language data rows (`pronunciation_activities`);
 * never hard-code sound rules here.
 */
import type { CefrLevel } from "@/lib/listening";

export type PronCategory =
  | "sounds" | "contrasts" | "words" | "phrases" | "sentences" | "stress" | "rhythm" | "intonation";

export type PronActivityType = "listen_repeat" | "compare_sounds" | "word_practice" | "phrase_practice";

/** One practice target. Every field except `text` is optional per language. */
export type PronItem = {
  text: string;
  ipa?: string;
  hint?: string;
  tip?: string;
  audio_url?: string;
  slow_audio_url?: string;
  /** indexes of stressed words / syllables to highlight */
  stress?: number[];
  translation?: string;
};

export type PronPair = { a: PronItem & { label?: string }; b: PronItem & { label?: string } };

export type PronunciationActivity = {
  id: string;
  language: string;
  title: string;
  description: string;
  cefr_level: CefrLevel;
  category: PronCategory;
  activity_type: PronActivityType;
  topic: string;
  target_text: string;
  phonetic_transcription: string | null;
  pronunciation_hint: string | null;
  pronunciation_tip: string | null;
  audio_url: string | null;
  slow_audio_url: string | null;
  example_words: string[];
  stress_data: { stressed?: number[] } | null;
  /** list of PronItem, or PronPair for compare_sounds */
  items: (PronItem | PronPair)[];
  duration_seconds: number;
  difficulty: number;
  sort_order: number;
};

export type PronProgressStatus = "not_started" | "in_progress" | "completed";
export type PronunciationProgress = {
  activity_id: string;
  status: Exclude<PronProgressStatus, "not_started">;
  score: number | null;
  practiced_items: number[];
  attempts: number;
};

export const CATEGORIES: { id: PronCategory; label: string; hint: string }[] = [
  { id: "sounds", label: "Glasovi", hint: "Samoglasnici, suglasnici i specifični glasovi" },
  { id: "contrasts", label: "Kontrasti glasova", hint: "Razlikuj i izgovori slične glasove" },
  { id: "words", label: "Reči", hint: "Izgovor pojedinačnih reči" },
  { id: "phrases", label: "Fraze", hint: "Česti izrazi i kratke fraze" },
  { id: "sentences", label: "Rečenice", hint: "Izgovor celih rečenica" },
  { id: "stress", label: "Naglasak", hint: "Naglasak u reči i rečenici" },
  { id: "rhythm", label: "Ritam", hint: "Prirodan ritam i povezan govor" },
  { id: "intonation", label: "Intonacija", hint: "Izjave, pitanja i drugi obrasci" },
];
export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label])) as Record<PronCategory, string>;

export const ACTIVITY_TYPE_LABELS: Record<PronActivityType, string> = {
  listen_repeat: "Slušaj i ponovi",
  compare_sounds: "Uporedi glasove",
  word_practice: "Izgovor reči",
  phrase_practice: "Fraze i rečenice",
};

export const isPair = (x: PronItem | PronPair): x is PronPair => "a" in x && "b" in x;

/** Items of an activity, falling back to the single target fields. */
export function activityItems(a: PronunciationActivity): (PronItem | PronPair)[] {
  if (a.items?.length) return a.items;
  if (!a.target_text) return [];
  return [{
    text: a.target_text,
    ipa: a.phonetic_transcription || undefined,
    hint: a.pronunciation_hint || undefined,
    tip: a.pronunciation_tip || undefined,
    audio_url: a.audio_url || undefined,
    slow_audio_url: a.slow_audio_url || undefined,
    stress: a.stress_data?.stressed,
  }];
}

const SPEECH_LANG: Record<string, string> = { no: "nb-NO", de: "de-DE", en: "en-GB" };
let current: HTMLAudioElement | null = null;

/**
 * Play model pronunciation. Uses recorded audio when present (slow file, or
 * slowed playback), otherwise the browser voice for the language as a fallback.
 */
export function playPronunciation(item: PronItem, language: string, slow = false, onEnd?: () => void) {
  current?.pause();
  window.speechSynthesis?.cancel();
  const url = slow ? item.slow_audio_url || item.audio_url : item.audio_url;
  if (url) {
    const audio = new Audio(url);
    if (slow && !item.slow_audio_url) audio.playbackRate = 0.7;
    audio.onended = () => onEnd?.();
    current = audio;
    audio.play().catch(() => onEnd?.());
    return;
  }
  if (!("speechSynthesis" in window)) return onEnd?.();
  const u = new SpeechSynthesisUtterance(item.text);
  u.lang = SPEECH_LANG[language] || language;
  u.rate = slow ? 0.6 : 0.95;
  u.onend = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopPronunciation() {
  current?.pause();
  window.speechSynthesis?.cancel();
}
