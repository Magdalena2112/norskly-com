import { describe, expect, it } from "vitest";
import no from "@/content/lessons/NO-HC-B1-L01.json";
import de from "@/content/lessons/DE-HC-B1-L01.json";
import { gradePractice, type PracticeValue } from "./grammarPractice";
import { vocabularyDedupKey, vocabularyXp, type VocabularyPracticeExercise } from "./vocabularyPractice";

function solution(ex: VocabularyPracticeExercise): PracticeValue {
  switch (ex.type) {
    case "choice": case "multi": case "truefalse": return ex.correct ?? [];
    case "match": return ex.pairs ?? [];
    case "gaps": return (ex.gaps ?? []).map((g) => g.answer);
    case "text": return (ex.inputs ?? []).map((i) => i.answers[0]);
    case "order": return (ex.answer?.[0] ?? "").split(" ");
  }
}

for (const lesson of [no, de]) {
  describe(lesson.code, () => {
    const exercises = lesson.modules.vocabulary.exercises as VocabularyPracticeExercise[];
    it("has 20 exercises", () => expect(exercises).toHaveLength(20));
    it("awards exactly 20 XP in total, one per exercise", () => {
      expect(exercises.every((ex) => ex.xp === 1)).toBe(true);
      expect(vocabularyXp(exercises, exercises.map((ex) => ex.code))).toBe(20);
    });
    it("splits areas into 7, 7 and 6 exercises without overlap", () => {
      const areas = lesson.modules.vocabulary.areas;
      expect(areas.map((a) => a.exercises.length)).toEqual([7, 7, 6]);
      expect(new Set(areas.flatMap((a) => a.exercises)).size).toBe(20);
      for (const area of areas) expect(exercises.filter((e) => area.exercises.includes(e.code)).every((e) => e.vocabularyFocus === area.key)).toBe(true);
    });
    it("includes six formats and matching illustrations", () => {
      expect(new Set(exercises.map((e) => e.type)).size).toBe(6);
      expect(exercises.filter((e) => e.leftImages?.length)).toHaveLength(2);
      const images = new Set(lesson.modules.vocabulary.areas.flatMap((a) => a.words.map((w) => w.img)));
      for (const ex of exercises) {
        for (const img of [...(ex.leftImages ?? []), ...(ex.image ? [ex.image] : [])]) expect(images.has(img)).toBe(true);
        if (ex.leftImages) expect(ex.leftImages.length).toBe(ex.left?.length);
      }
    });
    for (const ex of exercises) it(`${ex.code} accepts the solution and rejects empty or wrong answers`, () => {
      const valid = solution(ex);
      expect(gradePractice(ex, valid)).toBe(true);
      expect(gradePractice(ex, [])).toBe(false);
      const wrong = valid.map((v) => typeof v === "number" ? -1 : "netačan odgovor") as PracticeValue;
      expect(gradePractice(ex, wrong)).toBe(false);
    });
    it("counts replayed completion codes only once and ignores old completion without an award", () => {
      expect(vocabularyXp(exercises, ["VO-01", "VO-01", "G-01"])).toBe(1);
      expect(vocabularyXp(exercises, [])).toBe(0);
    });
  });
}

it("uses distinct reward keys for different lesson/language records", () => {
  expect(vocabularyDedupKey("norwegian-lesson", "VO-01")).toBe("lesson-vocabulary:norwegian-lesson:VO-01");
  expect(vocabularyDedupKey("german-lesson", "VO-01")).not.toBe(vocabularyDedupKey("norwegian-lesson", "VO-01"));
});