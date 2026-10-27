import { describe, expect, it } from "vitest";
import norwegian from "@/content/lessons/NO-HC-B1-L01.json";
import german from "@/content/lessons/DE-HC-B1-L01.json";
import { earnedXp, gradePractice, sameSentence, type PracticeExercise, type PracticeValue } from "./grammarPractice";

function solution(ex: PracticeExercise): PracticeValue {
  switch (ex.type) {
    case "choice": case "multi": case "truefalse": return ex.correct ?? [];
    case "order": return (ex.answer?.[0] ?? "").split(" ");
    case "gaps": return (ex.gaps ?? []).map(g => g.answer);
    case "text": return (ex.inputs ?? []).map(i => i.answers[0]);
    case "match": return ex.pairs ?? [];
  }
}

for (const lesson of [norwegian, german]) {
  const exercises = lesson.modules.grammar.exercises as PracticeExercise[];
  describe(`${lesson.code} medical grammar`, () => {
    it("has 30 independently completable exercises", () => {
      expect(exercises).toHaveLength(30);
      expect(new Set(exercises.map(e => e.code)).size).toBe(30);
      expect(exercises.map(e => e.code)).toEqual(Array.from({ length: 30 }, (_, i) => `G-${String(i + 1).padStart(2, "0")}`));
    });
    it("awards exactly 40 XP for full completion, without duplicate rewards", () => {
      const codes = exercises.map(e => e.code);
      expect(earnedXp(exercises, codes)).toBe(40);
      expect(earnedXp(exercises, [...codes, ...codes])).toBe(40);
      expect(earnedXp(exercises, [])).toBe(0);
    });
    it("covers all three grammar areas with ten exercises each", () => {
      expect(exercises.filter(e => e.grammarFocus === "indirect")).toHaveLength(10);
      expect(exercises.filter(e => e.grammarFocus === "subordinate")).toHaveLength(10);
      expect(exercises.filter(e => e.grammarFocus === "polite")).toHaveLength(10);
    });
    it("uses six distinct exercise formats", () => {
      expect(new Set(exercises.map(e => e.type))).toEqual(new Set(["choice", "multi", "order", "gaps", "text", "match"]));
    });
    for (const ex of exercises) {
      it(`${ex.code} accepts its solution and rejects an incorrect or empty answer`, () => {
        expect(gradePractice(ex, solution(ex))).toBe(true);
        expect(gradePractice(ex, ex.type === "match" ? (ex.pairs ?? []).map(() => -1) : [])).toBe(false);
        if (ex.type === "choice" || ex.type === "multi") {
          for (let i = 0; i < (ex.options?.length ?? 0); i++) {
            if (!ex.correct?.includes(i)) expect(gradePractice(ex, [i])).toBe(false);
          }
        }
        if (ex.type === "gaps") {
          expect(ex.text?.split("___").length).toBe((ex.gaps?.length ?? 0) + 1);
          for (const gap of ex.gaps ?? []) expect(gap.options).toContain(gap.answer);
        }
        if (ex.type === "order") {
          expect([...(ex.tokens ?? []).join(" ").split(" ")].sort()).toEqual([...(ex.answer?.[0] ?? "").split(" ")].sort());
        }
      });
    }
    it("requires the exact grammar in the final integrated task", () => {
      const final = exercises[29];
      const wrong = lesson.code.startsWith("NO")
        ? "Kunne du fortelle meg om du har ikke fått medisinen?"
        : "Könnten Sie mir sagen, ob Sie haben nicht geschlafen?";
      expect(gradePractice(final, [wrong])).toBe(false);
      expect(sameSentence(wrong, final.inputs?.[0].answers[0] ?? "")).toBe(false);
    });
  });
}