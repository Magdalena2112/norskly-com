import { describe, it, expect } from "vitest";
import lesson from "@/content/lessons/DE-A2-L01.json";
import { phraseRanges } from "./myDictionary";

describe("DE-A2-L01 intro key terms", () => {
  it("every intro text has 8 key terms, each highlighted in the text", () => {
    for (const t of (lesson as any).intro) {
      const text = t.lines.map((l: any) => l.text).join(" ");
      expect(t.keyTerms.length).toBe(8);
      const found = new Set(phraseRanges(text, t.keyTerms, "de").map((h) => h.word.word));
      expect(found.size).toBe(8);
    }
  });
  it("highlights a separated verb as its base form", () => {
    const hits = phraseRanges("Normalerweise stehe ich um sieben Uhr auf.", [{ word: "aufstehen", translation: "ustati", forms: ["stehe ich um sieben uhr auf"] }], "de");
    expect(hits[0].word.word).toBe("aufstehen");
  });
});
