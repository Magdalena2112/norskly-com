// Course lessons: metadata lives in `course_lessons`; full structured content
// is stored per lesson code under src/content/lessons/<CODE>.json and falls
// back to the row's `modules`/`intro_texts` columns when no file exists.

export interface DialogueLine { speaker: string; text: string }
export interface IntroText { id: string; title: string; type: "dialogue" | "narrative"; scene?: string; lines: DialogueLine[] }
export interface ExerciseItem { prompt: string; answers?: string[]; options?: string[]; open?: boolean; guide?: string; image?: string; audio?: string }
export interface Exercise { id: string; code: string; title: string; instruction: string; kind: string; items: ExerciseItem[] }

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

export function speakLines(
  lines: DialogueLine[],
  lang: string,
  opts: { slow?: boolean; onLine?: (i: number) => void; onEnd?: () => void } = {},
) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.cancel();
  const speakers = Array.from(new Set(lines.map((l) => l.speaker)));
  const voices = voicesFor(lang);
  lines.forEach((line, i) => {
    const u = new SpeechSynthesisUtterance(line.text.replace(/\s–\s/g, ", "));
    const idx = speakers.indexOf(line.speaker);
    u.lang = LOCALE[lang] || "en-GB";
    if (voices.length) u.voice = voices[idx % voices.length];
    u.pitch = PITCHES[idx % PITCHES.length];
    u.rate = opts.slow ? 0.7 : 0.95;
    u.onstart = () => opts.onLine?.(i);
    if (i === lines.length - 1) u.onend = () => opts.onEnd?.();
    synth.speak(u);
  });
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}
