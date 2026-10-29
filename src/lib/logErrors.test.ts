import { beforeEach, expect, it, vi } from "vitest";
const { insert } = vi.hoisted(() => ({ insert: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ insert }) } }));
import { logErrors } from "./logErrors";
beforeEach(() => { insert.mockReset(); insert.mockResolvedValue({ error: null }); });
it("records the actual answer, attempt and lesson independently in each language", async () => {
  for (const language of ["en", "no", "de"] as const) {
    await logErrors("student", "vocabulary", "lesson_practice", [{ category: "vocabulary", topic: "VO-01", severity: 2, example_wrong: "wrong", example_correct: "correct" }], "question", 2, language, "lesson");
    expect(insert).toHaveBeenLastCalledWith([expect.objectContaining({ user_id: "student", module: "vocabulary", language, lesson_id: "lesson", attempt_no: 2, example_wrong: "wrong", example_correct: "correct" })]);
  }
});