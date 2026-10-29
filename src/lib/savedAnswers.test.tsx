import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: { id: "u1" } }) }));
vi.mock("@/integrations/supabase/client", () => {
  const q: any = { select: () => q, eq: () => q, upsert: () => Promise.resolve({}), then: (r: any) => Promise.resolve({ data: [] }).then(r) };
  return { supabase: { from: () => q } };
});
import { useSavedState, resetSavedAnswersCache } from "./savedAnswers";

describe("saved exercise answers", () => {
  beforeEach(() => { localStorage.clear(); resetSavedAnswersCache(); });
  it("restores an answer and its correctness after the exercise is reopened", () => {
    const a = renderHook(() => useSavedState("gp:G-01:result", "idle"));
    act(() => a.result.current[1]("correct"));
    a.unmount();
    resetSavedAnswersCache();
    const b = renderHook(() => useSavedState("gp:G-01:result", "idle"));
    expect(b.result.current[0]).toBe("correct");
  });
});
