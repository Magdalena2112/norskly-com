/**
 * Listening module — shared types, level guidelines and the activity-type /
 * question-type registry. Add new types here instead of changing pages.
 */
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export type ActivityType =
  | "listen_understand"
  | "multiple_choice"
  | "true_false"
  | "fill_gaps"
  | "choose_heard"
  | "listen_match"
  | "dialogue"
  | "listen_repeat";

export type Segment = { start: number; end: number; text: string; speaker?: string };

type Base = { id: string; prompt: string; explanation?: string; seg?: number | null };
export type McQuestion = Base & { type: "mc" | "heard"; options: string[]; answer: string };
export type TfQuestion = Base & { type: "tf"; answer: boolean };
export type GapQuestion = Base & { type: "gap"; answer: string };
export type MatchQuestion = Base & { type: "match"; pairs: { left: string; right: string }[] };
export type RepeatQuestion = Base & { type: "repeat"; text: string };
export type Question = McQuestion | TfQuestion | GapQuestion | MatchQuestion | RepeatQuestion;

export type ListeningActivity = {
  id: string;
  language: string;
  title: string;
  description: string;
  cefr_level: CefrLevel;
  topic: string;
  activity_type: ActivityType;
  audio_url: string | null;
  transcript: string;
  segments: Segment[];
  questions: Question[];
  duration_seconds: number;
  difficulty: number;
  sort_order: number;
};

export type ListeningProgress = {
  activity_id: string;
  status: "in_progress" | "completed";
  score: number;
  total: number;
  attempts: number;
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  listen_understand: "Slušaj i razumi",
  multiple_choice: "Višestruki izbor",
  true_false: "Tačno / netačno",
  fill_gaps: "Popuni praznine",
  choose_heard: "Izaberi šta si čuo/la",
  listen_match: "Slušaj i poveži",
  dialogue: "Dijalog",
  listen_repeat: "Slušaj i ponovi",
};

/** Content guidelines for authoring future activities (not shown per activity). */
export const LEVEL_GUIDELINES: Record<CefrLevel, string[]> = {
  A1: ["vrlo kratke rečenice", "spor i jasan govor", "poznat svakodnevni vokabular"],
  A2: ["kratki dijalozi", "jednostavne svakodnevne situacije"],
  B1: ["duži razgovori", "prirodniji tempo govora", "detaljnija pitanja razumevanja"],
  B2: ["prirodan govor", "duži snimci", "implicitno značenje i složenije razumevanje"],
  // C1 — placeholder; detaljni kriterijumi biće definisani kasnije.
  C1: ["autentičan govor", "složene i apstraktne teme"],
};

const norm = (s: string) =>
  s.toLowerCase().normalize("NFC").replace(/[.,!?;:"„“”']/g, "").replace(/\s+/g, " ").trim();

/** Whether a question counts toward the score. */
export const isScored = (q: Question) => q.type !== "repeat";

/** Grade one answer. Returns true when correct. */
export function gradeQuestion(q: Question, answer: unknown): boolean {
  switch (q.type) {
    case "mc":
    case "heard":
      return answer === q.answer;
    case "tf":
      return answer === q.answer;
    case "gap":
      return typeof answer === "string" && norm(answer) === norm(q.answer);
    case "match": {
      const a = (answer || {}) as Record<string, string>;
      return q.pairs.every((p) => a[p.left] === p.right);
    }
    case "repeat":
      return true;
  }
}

export function correctAnswerText(q: Question): string {
  switch (q.type) {
    case "mc":
    case "heard":
    case "gap":
      return q.answer;
    case "tf":
      return q.answer ? "Tačno" : "Netačno";
    case "match":
      return q.pairs.map((p) => `${p.left} → ${p.right}`).join(" · ");
    case "repeat":
      return q.text;
  }
}

export const formatTime = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};
