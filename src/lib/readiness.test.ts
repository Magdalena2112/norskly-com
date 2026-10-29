import { describe, it, expect } from "vitest";
import { computeReadiness } from "./readiness";

const now = new Date("2026-10-29T12:00:00Z");
const act = (module: string, type: string, day: number, payload?: unknown) => ({
  module, type, payload, created_at: new Date(now.getTime() - day * 86400000).toISOString(),
});
const base = { errors: [], readingScores: [], lessonsTotal: 10, lessonsCompleted: 0, now };

describe("computeReadiness", () => {
  it("is 0 with no practice", () => {
    const r = computeReadiness({ ...base, activities: [] });
    expect(r.total).toBe(0);
  });

  it("one perfect grammar answer does not give full grammar score", () => {
    const r = computeReadiness({ ...base, activities: [act("grammar", "lesson_grammar_exercise", 0)] });
    expect(r.system).toBeLessThanOrEqual(5);
  });

  it("2 of 15 perfect comprehension items stay around 13", () => {
    const r = computeReadiness({ ...base, activities: [act("listening", "lesson_scene", 0), act("listening", "lesson_scene", 0)] });
    expect(r.comprehension).toBe(13);
  });

  it("blocks level-up below 60% lessons even with high total", () => {
    const many = (m: string, t: string, n: number) => Array.from({ length: n }, (_, i) => act(m, t, i % 10));
    const activities = [...many("listening", "lesson_scene", 15), ...many("talk", "session_complete", 10), ...many("grammar", "lesson_grammar_exercise", 30)];
    const low = computeReadiness({ ...base, activities, lessonsCompleted: 5 });
    expect(low.total).toBeGreaterThanOrEqual(75);
    expect(low.canLevelUp).toBe(false);
    const ok = computeReadiness({ ...base, activities, lessonsCompleted: 6 });
    expect(ok.canLevelUp).toBe(true);
  });
});
