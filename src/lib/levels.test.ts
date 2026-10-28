import { describe, it, expect } from "vitest";
import { computeLevelStates } from "./levels";
describe("level access", () => {
  it("unlocks only the enrolled level", () => {
    const lessons = [{ id: "a", cefr_level: "A1" }, { id: "b", cefr_level: "A2" }, { id: "c", cefr_level: "B1" }];
    const s = computeLevelStates("A2", lessons, { a: "completed", b: "completed" });
    expect(s.filter((x) => x.unlocked).map((x) => x.level)).toEqual(["A2"]);
  });
});
