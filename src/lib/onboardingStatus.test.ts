import { beforeEach, describe, expect, it, vi } from "vitest";
import { isLanguageOnboarded } from "./onboardingStatus";
const { result } = vi.hoisted(() => ({ result: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ eq: () => ({ maybeSingle: result }) }) }) }) }) } }));
beforeEach(() => result.mockReset());
describe("onboarding lookup", () => {
  it("does not treat a failed enrollment read as incomplete onboarding", async () => {
    const error = new Error("Network unavailable"); result.mockResolvedValue({ data: null, error });
    await expect(isLanguageOnboarded("student", "de", "health")).rejects.toBe(error);
  });
  it("uses the saved enrollment completion", async () => {
    result.mockResolvedValue({ data: { onboarding_completed: true }, error: null });
    await expect(isLanguageOnboarded("student", "de", "health")).resolves.toBe(true);
  });
});