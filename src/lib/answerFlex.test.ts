import { describe, it, expect } from "vitest";
import { isCorrect } from "./courseLessons";

describe("vocabulary answer flexibility", () => {
  it("accepts another person's possessive in vocabulary items", () => {
    expect(isCorrect("brush my teeth", ["brush your teeth"], { lenient: true })).toBe(true);
    expect(isCorrect("to brush teeth", ["brush your teeth"], { lenient: true })).toBe(true);
    expect(isCorrect("Zähne putzen", ["sich die Zähne putzen"], { lenient: true })).toBe(true);
    expect(isCorrect("å spise frokost", ["spise frokost"], { lenient: true })).toBe(true);
  });
  it("still rejects a different action", () => {
    expect(isCorrect("wash my hands", ["brush your teeth"], { lenient: true })).toBe(false);
  });
  it("stays strict outside vocabulary exercises", () => {
    expect(isCorrect("It is your book.", ["It is my book."])).toBe(false);
  });
});
