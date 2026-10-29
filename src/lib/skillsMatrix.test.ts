import { describe, it, expect } from "vitest";
import { buildRubricLine } from "../../supabase/functions/_shared/pedagogy/skillsMatrix";

describe("skills matrix rubric", () => {
  it("uses Norwegian A1 V2 focus", () => {
    expect(buildRubricLine("no", "A1", ["grammar"])).toContain("V2 posle vremenske odredbe");
  });
  it("uses German A2 Wechselpräpositionen", () => {
    expect(buildRubricLine("de", "A2", ["grammar"])).toContain("Wechselpräpositionen");
  });
  it("keeps languages separate", () => {
    expect(buildRubricLine("en", "A1", ["grammar"])).not.toContain("V2");
  });
  it("falls back to A1 for unknown level", () => {
    expect(buildRubricLine("en", "xx", ["grammar"])).toContain("(A1, en)");
  });
});
