export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

/** Share of completed lessons in a level required to unlock the next one. Change here only. */
export const LEVEL_UNLOCK_THRESHOLD = 0.6;

export function normalizeLevel(raw?: string | null): CefrLevel {
  const m = String(raw || "").match(/[ABC][12]/)?.[0] as CefrLevel | undefined;
  return m && CEFR_LEVELS.includes(m) ? m : "A1";
}

export type LevelState = { level: CefrLevel; total: number; done: number; ratio: number; unlocked: boolean };

/** Only the enrolled level is open. LEVEL_UNLOCK_THRESHOLD is kept for display/future progression. */
export function computeLevelStates(
  startLevel: CefrLevel,
  lessons: { id: string; cefr_level: string }[],
  progress: Record<string, string>,
): LevelState[] {
  const startIdx = CEFR_LEVELS.indexOf(startLevel);
  const out: LevelState[] = [];
  CEFR_LEVELS.forEach((level, i) => {
    const inLevel = lessons.filter((l) => l.cefr_level === level);
    const done = inLevel.filter((l) => progress[l.id] === "completed").length;
    const ratio = inLevel.length ? done / inLevel.length : 0;
    const prev = out[i - 1];
    void prev;
    const unlocked = i === startIdx;
    out.push({ level, total: inLevel.length, done, ratio, unlocked });
  });
  return out;
}
