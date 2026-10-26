import { describe, it, expect } from "vitest";
import lesson from "@/content/lessons/NO-A2-L01.json";
import { gradePractice, earnedXp, type PracticeExercise } from "./grammarPractice";

const ex = (lesson as any).modules.grammar.exercises as PracticeExercise[];
const byCode = (c: string) => ex.find((e) => e.code === c)!;

describe("NO-A2-L01 grammar practice", () => {
  it("has exactly 30 exercises worth 40 XP (G-01–20 = 1, G-21–30 = 2)", () => {
    expect(ex.length).toBe(30);
    expect(ex.reduce((s, e) => s + e.xp, 0)).toBe(40);
    expect(byCode("G-20").xp).toBe(1);
    expect(byCode("G-21").xp).toBe(2);
  });
  it("accepts correct word order ignoring capital and full stop", () => {
    expect(gradePractice(byCode("G-21"), ["i dag besøker Maria søsteren sin"])).toBe(true);
  });
  it("rejects missing inversion", () => {
    expect(gradePractice(byCode("G-21"), ["I dag Maria besøker søsteren sin."])).toBe(false);
  });
  it("rejects wrong ikke position in ordering", () => {
    expect(gradePractice(byCode("G-04"), ["På søndager", "jobber", "ikke", "vi"])).toBe(false);
    expect(gradePractice(byCode("G-04"), ["På søndager", "jobber", "vi", "ikke"])).toBe(true);
  });
  it("multi-select needs exactly A and C", () => {
    expect(gradePractice(byCode("G-22"), [0, 2])).toBe(true);
    expect(gradePractice(byCode("G-22"), [0, 2, 1])).toBe(false);
  });
  it("G-29 needs both sentences correct", () => {
    expect(gradePractice(byCode("G-29"), ["Vanligvis spiser vi middag klokka seks.", "På lørdager barna legger seg ikke tidlig."])).toBe(false);
  });
  it("counts XP once per exercise", () => {
    expect(earnedXp(ex, ["G-21", "G-21", "G-01"])).toBe(3);
  });
});
