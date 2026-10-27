import { describe, it, expect } from "vitest";
import lesson from "@/content/lessons/DE-A2-L01.json";
import { gradePractice, type PracticeExercise } from "./grammarPractice";

const ex = (lesson as any).modules.grammar.exercises as PracticeExercise[];
const byCode = (c: string) => ex.find((e) => e.code === c)!;

describe("DE-A2-L01 grammar practice", () => {
  it("has exactly 30 exercises worth 40 XP", () => {
    expect(ex.length).toBe(30);
    expect(ex.reduce((s, e) => s + e.xp, 0)).toBe(40);
  });
  it("separable verb: prefix must go to the end", () => {
    expect(gradePractice(byCode("G-22"), ["Ich kaufe heute im Supermarkt ein."])).toBe(true);
    expect(gradePractice(byCode("G-22"), ["Ich einkaufe heute im Supermarkt."])).toBe(false);
  });
  it("ordering keeps the prefix last", () => {
    expect(gradePractice(byCode("G-03"), ["Normalerweise", "stehe", "ich", "um sieben Uhr", "auf"])).toBe(true);
    expect(gradePractice(byCode("G-03"), ["Normalerweise", "ich", "stehe", "um sieben Uhr", "auf"])).toBe(false);
  });
  it("V2: inversion after a time expression", () => {
    expect(gradePractice(byCode("G-21"), ["heute besucht Lena ihre Schwester"])).toBe(true);
    expect(gradePractice(byCode("G-21"), ["Heute Lena besucht ihre Schwester."])).toBe(false);
  });
});
