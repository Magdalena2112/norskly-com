import { describe, expect, it } from "vitest";
import { matchesTypedAnswer } from "./typedAnswers";
import { isCorrect } from "./courseLessons";
import { gradePractice, type PracticeExercise } from "./grammarPractice";
import { gradeQuestion, type GapQuestion } from "./listening";

describe("typed grammar and listening tolerance", () => {
  it("accepts contracted and full English forms in lesson dopune", () => {
    expect(isCorrect("She doesn’t work here.", ["She does not work here"], { typed: true })).toBe(true);
    expect(isCorrect("They are working", ["They're working"], { typed: true })).toBe(true);
    expect(matchesTypedAnswer("I can't come", ["I cannot come"])).toBe(true);
  });
  it("accepts formatting variations in all three learning languages", () => {
    for (const [value, answer] of [["  I WORK HERE! ", "I work here"], ["I DAG JOBBER JEG.", "I dag jobber jeg"], ["Heute arbeite ich, hier!", "Heute arbeite ich hier"]]) {
      expect(matchesTypedAnswer(value, [answer])).toBe(true);
    }
  });
  it("preserves meaning, tense, articles, case endings and word order", () => {
    for (const [value, answer] of [["She work here", "She works here"], ["I do work", "I do not work"], ["I dag jeg jobber", "I dag jobber jeg"], ["Jeg ser bil", "Jeg ser bilen"], ["Ich sehe der Mann", "Ich sehe den Mann"], ["I washed my hands", "I wash my hands"]]) {
      expect(matchesTypedAnswer(value, [answer])).toBe(false);
    }
  });
  it("does not guess ambiguous contractions or drop apostrophes", () => {
    expect(matchesTypedAnswer("He's worked", ["He has worked"])).toBe(false);
    expect(matchesTypedAnswer("its", ["it's"])).toBe(false);
    expect(matchesTypedAnswer("", [""])).toBe(false);
  });
  it("uses tolerance for structured text but leaves selected gaps and order strict", () => {
    const text: PracticeExercise = { id: "t", code: "t", title: "", instruction: "", xp: 1, type: "text", inputs: [{ prompt: "", answers: ["I do not work"] }] };
    expect(gradePractice(text, ["I don't work."])).toBe(true);
    expect(gradePractice({ ...text, type: "gaps", gaps: [{ options: ["do", "does"], answer: "does" }] }, ["do"])).toBe(false);
    expect(gradePractice({ ...text, type: "order", answer: ["I do not work"] }, ["I", "don't", "work"])).toBe(false);
  });
  it("uses tolerance and authored alternatives for listening gaps only", () => {
    const gap: GapQuestion = { id: "g", prompt: "", type: "gap", answer: "do not", answers: ["never"] };
    expect(gradeQuestion(gap, "DON’T!")).toBe(true);
    expect(gradeQuestion(gap, "never")).toBe(true);
    expect(gradeQuestion(gap, "do")).toBe(false);
    expect(gradeQuestion({ id: "m", prompt: "", type: "mc", options: ["do not", "do"], answer: "do not" }, "don't")).toBe(false);
  });
  it("keeps exact forms when spelling or capitalization is the objective", () => {
    expect(matchesTypedAnswer("sie", ["Sie"], true)).toBe(false);
    expect(isCorrect("don't", ["do not"], { typed: true, exactForm: true })).toBe(false);
    expect(gradeQuestion({ id: "g", prompt: "", type: "gap", answer: "Sie", exactForm: true }, "sie")).toBe(false);
  });
});