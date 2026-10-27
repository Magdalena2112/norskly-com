import { describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { phrasesInText } from "./myDictionary";
import de from "@/content/lessons/DE-HC-B1-L01.json";
import { lessonWords } from "./myDictionary";

describe("German key phrases", () => {
  it("finds inflected forms in text but lists the base form", () => {
    const words = lessonWords((de as any).modules.vocabulary);
    const text = (de as any).intro[0].lines.map((l: any) => l.text).join(" ");
    const list = phrasesInText(text, words, 8, "de").map((w) => w.word);
    expect(list).toContain("der Puls");
    expect(list).toContain("die Übergabe");
    expect(list).toContain("den Blutdruck messen");
  });
});
