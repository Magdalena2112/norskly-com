import { beforeEach, expect, it, vi } from "vitest";
import { completeLessonExercise } from "./lessonRewards";
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));
beforeEach(() => vi.clearAllMocks());
it("sends only lesson and exercise identity, never caller-selected points", async () => {
  rpc.mockResolvedValue({ data: { points_awarded: 2 }, error: null });
  expect(await completeLessonExercise("lesson-id", "G-02")).toEqual({ points_awarded: 2 });
  expect(rpc).toHaveBeenCalledWith("complete_lesson_exercise", { _lesson_id: "lesson-id", _code: "G-02" });
});
it("preserves zero rewards returned for repeated completion", async () => {
  rpc.mockResolvedValue({ data: { points_awarded: 0 }, error: null });
  expect(await completeLessonExercise("lesson-id", "G-02")).toEqual({ points_awarded: 0 });
});
it("surfaces failed saves instead of reporting completed rewards", async () => {
  rpc.mockResolvedValue({ data: null, error: new Error("Not enrolled") });
  await expect(completeLessonExercise("lesson-id", "G-02")).rejects.toThrow("Not enrolled");
});