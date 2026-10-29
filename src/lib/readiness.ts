// CEFR readiness: four skill pillars. Each pillar = quality × coverage,
// so a tiny sample (e.g. one correct answer) can never produce 100/100.

export interface ReadinessActivity { module: string; type: string; payload?: unknown; created_at: string }
export interface ReadinessError { module: string; severity: number }
export interface ReadinessInput {
  activities: ReadinessActivity[];
  errors: ReadinessError[];
  readingScores: { score: number; total: number }[];
  lessonsTotal: number;
  lessonsCompleted: number;
  now?: Date;
}
export interface ReadinessResult {
  total: number;
  comprehension: number;
  production: number;
  system: number;
  coverage: number;
  lessonPct: number;
  canLevelUp: boolean;
}

export const WEIGHTS = { comprehension: 0.25, production: 0.25, system: 0.3, coverage: 0.2 };
export const TARGETS = { comprehension: 15, production: 10, system: 30, activeDays: 10 };
export const LEVEL_UP_TOTAL = 75;
export const LEVEL_UP_LESSON_PCT = 60;

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const pct = (p: unknown): number | null => {
  const v = (p as any)?.percentage ?? (p as any)?.score;
  return typeof v === "number" && isFinite(v) ? clamp(v) : null;
};

/** Quality from error load: each error costs points by severity, relative to sample size. */
function quality(n: number, errs: ReadinessError[], scores: number[]): number {
  if (n === 0) return 0;
  const penalty = errs.reduce((s, e) => s + Math.max(1, Math.min(3, e.severity)) * 10, 0) / n;
  const errQuality = clamp(100 - penalty);
  if (!scores.length) return errQuality;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return (errQuality + avg) / 2;
}

const coverageOf = (n: number, target: number) => Math.min(1, n / target);

export function computeReadiness(input: ReadinessInput): ReadinessResult {
  const { activities, errors, readingScores, lessonsTotal, lessonsCompleted } = input;
  const now = input.now ?? new Date();
  const by = (mods: string[]) => activities.filter((a) => mods.includes(a.module));
  const errBy = (mods: string[]) => errors.filter((e) => mods.includes(e.module));

  // 1. Comprehension: listening + reading
  const listen = by(["listening"]);
  const readPcts = readingScores.filter((r) => r.total > 0).map((r) => clamp((r.score / r.total) * 100));
  const nComp = listen.length + readPcts.length;
  const comprehension = quality(nComp, errBy(["listening", "reading"]), readPcts) * coverageOf(nComp, TARGETS.comprehension);

  // 2. Production: pronunciation, writing, talk
  const writing = activities.filter((a) => a.type === "lesson_writing" || a.module === "writing");
  const prod = [...by(["pronunciation", "talk"]).filter((a) => a.type !== "lesson_scheduled"), ...writing];
  const prodScores = prod.map((a) => (a.module === "pronunciation" ? pct(a.payload) : null)).filter((v): v is number => v !== null);
  const production = quality(prod.length, errBy(["pronunciation", "talk", "writing"]), prodScores) * coverageOf(prod.length, TARGETS.production);

  // 3. Language system: grammar + vocabulary (writing excluded)
  const sys = by(["grammar", "vocabulary"]).filter((a) => a.type !== "lesson_writing");
  const sysScores = sys.filter((a) => a.type === "quiz_completed" || a.type === "exercises_completed")
    .map((a) => pct(a.payload)).filter((v): v is number => v !== null);
  const system = quality(sys.length, errBy(["grammar", "vocabulary"]), sysScores) * coverageOf(sys.length, TARGETS.system);

  // 4. Level coverage (60%) + continuity: active days in last 14 (40%)
  const lessonPct = lessonsTotal > 0 ? clamp((lessonsCompleted / lessonsTotal) * 100) : 0;
  const since = now.getTime() - 14 * 86400000;
  const days = new Set(activities.filter((a) => new Date(a.created_at).getTime() >= since).map((a) => a.created_at.slice(0, 10))).size;
  const coverage = lessonPct * 0.6 + coverageOf(days, TARGETS.activeDays) * 100 * 0.4;

  const total = Math.round(
    comprehension * WEIGHTS.comprehension + production * WEIGHTS.production + system * WEIGHTS.system + coverage * WEIGHTS.coverage,
  );
  return {
    total: clamp(total),
    comprehension: Math.round(comprehension),
    production: Math.round(production),
    system: Math.round(system),
    coverage: Math.round(coverage),
    lessonPct: Math.round(lessonPct),
    canLevelUp: total >= LEVEL_UP_TOTAL && lessonPct >= LEVEL_UP_LESSON_PCT,
  };
}
