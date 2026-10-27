import { describe, expect, it } from "vitest";
import no from "@/content/lessons/NO-HC-B1-L01.json";
import de from "@/content/lessons/DE-HC-B1-L01.json";
describe("Medical B1 listening", () => {
  for (const l of [no, de]) it(`${l.code}: 10 scenes worth 10 XP total`, () => {
    const s = (l.modules.listening as any).scenes as any[];
    expect(s).toHaveLength(10);
    expect(s.reduce((a, x) => a + x.xp, 0)).toBe(10);
    for (const x of s) for (const q of x.questions) expect(q.options).toContain(q.answer);
  });
});
