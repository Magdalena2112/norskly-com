// Course lessons: metadata lives in `course_lessons`; full structured content
// is stored per lesson code under src/content/lessons/<CODE>.json and falls
// back to the row's `modules`/`intro_texts` columns when no file exists.

export interface DialogueLine { speaker: string; text: string }
export interface IntroText { id: string; title: string; type: "dialogue" | "narrative" | "monologue" | "email"; scene?: string; lines: DialogueLine[] }
export interface ExerciseItem { prompt: string; answers?: string[]; options?: string[]; open?: boolean; guide?: string; guiding?: string[]; image?: string; audio?: string }
export interface Exercise { id: string; code: string; title: string; instruction: string; kind: string; image?: string; items: ExerciseItem[] }

export interface LessonContent {
  code: string;
  intro: IntroText[];
  modules: Record<string, any>;
}

const files = import.meta.glob("../content/lessons/*.json");

export async function loadLessonContent(row: { lesson_code: string | null; intro_texts?: any; modules?: any; text_segments?: any; text_title?: string }): Promise<LessonContent> {
  const key = row.lesson_code ? `../content/lessons/${row.lesson_code}.json` : "";
  if (key && files[key]) {
    const mod: any = await files[key]();
    return (mod.default || mod) as LessonContent;
  }
  // Fallback for lessons stored only in the database.
  const intro: IntroText[] = Array.isArray(row.intro_texts) && row.intro_texts.length
    ? row.intro_texts
    : Array.isArray(row.text_segments) && row.text_segments.length
      ? [{ id: "T01", title: row.text_title || "Tekst", type: "dialogue", lines: row.text_segments }]
      : [];
  return { code: row.lesson_code || "", intro, modules: row.modules || {} };
}

export const LESSON_TABS: { key: string; label: string }[] = [
  { key: "intro", label: "Uvod" },
  { key: "grammar", label: "Gramatika" },
  { key: "vocabulary", label: "Vokabular" },
  { key: "reading", label: "Čitanje" },
  { key: "listening", label: "Slušanje" },
  { key: "writing", label: "Pisanje" },
  { key: "pronunciation", label: "Izgovor" },
  { key: "speaking", label: "Govor" },
  { key: "culture", label: "Kultura" },
  { key: "review", label: "Ponavljanje" },
];

export function allExercises(content: LessonContent): Exercise[] {
  return Object.values(content.modules).flatMap((m: any) => (m?.exercises as Exercise[]) || []);
}

export function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/[.,!?;:"“”„]/g, "")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function isCorrect(value: string, answers: string[] = []) {
  const v = normalize(value);
  if (!v) return false;
  return answers.some((a) => {
    const n = normalize(a);
    return n === v || n.replace(/-/g, "") === v.replace(/[-\s]/g, "");
  });
}

export function speakerCount(lines: DialogueLine[]) {
  return new Set(lines.map((l) => l.speaker)).size;
}

// ---- Browser speech: a different voice/pitch per speaker ----
const LOCALE: Record<string, string> = { en: "en-GB", no: "nb-NO", de: "de-DE" };

function voicesFor(lang: string) {
  const all = typeof window !== "undefined" ? window.speechSynthesis?.getVoices() || [] : [];
  const prefix = (LOCALE[lang] || "en-GB").slice(0, 2);
  const exact = all.filter((v) => v.lang.replace("_", "-") === LOCALE[lang]);
  const loose = all.filter((v) => v.lang.startsWith(prefix));
  return exact.length ? [...exact, ...loose.filter((v) => !exact.includes(v))] : loose;
}

const PITCHES = [1, 0.8, 1.2, 0.95, 1.1];

// Pre-recorded natural voices per speaker: src/content/lessons/<code>.audio.json maps "speaker|text" -> clip URL.
const CLIPS: Record<string, string> = Object.assign(
  {},
  ...Object.values(import.meta.glob("../content/lessons/*.audio.json", { eager: true, import: "default" }) as unknown as Record<string, string>[]),
);
let session = 0;
let currentAudio: HTMLAudioElement | null = null;

// On-demand natural TTS (server-side, cached in storage) for lines without a pre-recorded clip.
const MALE_SPEAKERS = new Set(["oliver", "tom", "jack", "mr brown", "ben", "dan", "leo", "max", "sam", "liam", "jonas", "markus", "erik", "ola", "lars", "ahmed", "programleder"]);
const ttsCache = new Map<string, Promise<string | null>>();

function naturalClip(line: DialogueLine, lang: string): Promise<string | null> {
  const key = `${lang}|${line.speaker}|${line.text}`;
  if (!ttsCache.has(key)) {
    ttsCache.set(key, (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!s) return null;
        const voice = MALE_SPEAKERS.has(line.speaker.toLowerCase()) ? "m" : line.speaker === "m" ? "n" : "f";
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lesson-tts`, {
          method: "POST",
          headers: { Authorization: `Bearer ${s.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ text: line.text, language: lang, voice }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return typeof data?.url === "string" ? data.url : null;
      } catch {
        return null;
      }
    })());
  }
  return ttsCache.get(key)!;
}

function playClips(lines: DialogueLine[], urls: string[], rate: number, opts: { onLine?: (i: number) => void; onEnd?: () => void }) {
  const id = ++session;
  const playAt = (i: number) => {
    if (id !== session) return;
    if (i >= lines.length) { currentAudio = null; opts.onEnd?.(); return; }
    const a = new Audio(urls[i]);
    a.playbackRate = rate;
    (a as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
    currentAudio = a;
    opts.onLine?.(i);
    const next = () => setTimeout(() => playAt(i + 1), lines.length > 1 ? 350 : 0);
    a.onended = next;
    a.onerror = next;
    a.play().catch(next);
  };
  playAt(0);
}

export function speakLines(
  lines: DialogueLine[],
  lang: string,
  opts: { slow?: boolean; rate?: number; onLine?: (i: number) => void; onEnd?: () => void } = {},
) {
  stopSpeaking();
  const rate = opts.rate ?? (opts.slow ? 0.75 : 1);
  if (!lines.length) return;
  if (lines.every((l) => CLIPS[`${l.speaker}|${l.text}`]) && typeof Audio !== "undefined") {
    playClips(lines, lines.map((l) => CLIPS[`${l.speaker}|${l.text}`]), rate, opts);
    return;
  }
  // Try natural server-side voices first; fall back to the browser voice on any failure.
  const id = session;
  void Promise.all(lines.map((l) => naturalClip(l, lang))).then((urls) => {
    if (id !== session) return; // stopped or replaced meanwhile
    if (urls.every((u) => u) && typeof Audio !== "undefined") {
      playClips(lines, urls as string[], rate, opts);
    } else {
      speakBrowser(lines, lang, { ...opts, rate: opts.rate ?? (opts.slow ? 0.7 : 0.95) });
    }
  });
}

function speakBrowser(
  lines: DialogueLine[],
  lang: string,
  opts: { rate: number; onLine?: (i: number) => void; onEnd?: () => void },
) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  const speakers = Array.from(new Set(lines.map((l) => l.speaker)));
  const voices = voicesFor(lang);
  lines.forEach((line, i) => {
    const u = new SpeechSynthesisUtterance(line.text.replace(/\s–\s/g, ", "));
    const idx = speakers.indexOf(line.speaker);
    u.lang = LOCALE[lang] || "en-GB";
    if (voices.length) u.voice = voices[idx % voices.length];
    u.pitch = PITCHES[idx % PITCHES.length];
    u.rate = opts.rate;
    u.onstart = () => opts.onLine?.(i);
    if (i === lines.length - 1) u.onend = () => opts.onEnd?.();
    synth.speak(u);
  });
}

export function stopSpeaking() {
  session++;
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}
