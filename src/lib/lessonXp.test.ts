import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { allocateXp, withLessonXp } from "../../supabase/functions/_shared/lessonXp";

const directory = path.resolve(__dirname, "../../supabase/functions/_shared/course-content");
const files = fs.readdirSync(directory).filter(f => f.endsWith(".json"));
describe("Lesson rewards", () => {
  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(directory, file), "utf8"));
    const lesson = withLessonXp(raw);
    for (const [module, expected] of Object.entries({ grammar: 40, vocabulary: 20, pronunciation: 10, listening: 10, writing: 20 })) {
      it(`${file}: ${module} awards exactly ${expected} XP`, () => {
        const items = module === "listening" ? lesson.modules[module].scenes : lesson.modules[module].exercises;
        expect(items.length).toBeGreaterThan(0);
        expect(items.reduce((sum: number, item: { xp: number }) => sum + item.xp, 0)).toBe(expected);
        expect(items.every((item: { xp: number }) => Number.isInteger(item.xp) && item.xp > 0)).toBe(true);
      });
    }
    it(`${file}: lesson awards 100 XP and review awards no XP`, () => {
      const sum = Object.entries(lesson.modules).reduce((total, [module, value]) => {
        const content = value as any;
        return total + (module === "listening" ? content.scenes || [] : content.exercises || []).reduce((n: number, ex: { xp: number }) => n + ex.xp, 0);
      }, 0);
      expect(sum).toBe(100);
      expect(lesson.modules.review.quiz.bonusXp).toBe(0);
      expect(lesson.modules.review.quiz.passScore).toBe(8);
    });
    it(`${file}: authoring mirrors stay synchronized and input remains unchanged`, () => {
      expect(JSON.parse(fs.readFileSync(path.resolve(__dirname, "../content/lessons", file), "utf8"))).toEqual(raw);
      expect(withLessonXp(lesson)).toEqual(lesson);
      expect(raw).toEqual(JSON.parse(fs.readFileSync(path.join(directory, file), "utf8")));
    });
  }
  it("allocates integer XP consistently with database grammar and writing rules", () => {
    expect(allocateXp(40, 30)).toEqual([...Array(10).fill(2), ...Array(20).fill(1)]);
    expect(allocateXp(40, 40)).toEqual(Array(40).fill(1));
    expect(allocateXp(20, 5)).toEqual(Array(5).fill(4));
    expect(allocateXp(20, 2)).toEqual([10, 10]);
  });
});
