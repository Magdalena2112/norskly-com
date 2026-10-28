import { describe, expect, it } from "vitest";
import { TALK_SCENARIOS } from "@/content/lessons/talkScenarios";
import { TALK_SCENARIOS as serverScenarios } from "../../supabase/functions/_shared/course-content/talkScenarios";
import { lessonScenarioUrl, selectedLessonScenario } from "./lessonSpeaking";

describe("German A2 lesson conversations", () => {
  const scenarios = TALK_SCENARIOS["DE-A2-L01"];
  it("provides the same four topic IDs as English and Norwegian A2", () => {
    expect(scenarios.map((s) => s.id)).toEqual(["S-01", "S-02", "S-03", "S-04"]);
    for (const code of ["EN-A2-L01", "NO-A2-L01"]) {
      expect(scenarios.map((s) => s.id)).toEqual(TALK_SCENARIOS[code].map((s) => s.id));
    }
  });
  it("keeps displayed tasks and roles aligned with the protected registry", () => {
    expect(scenarios).toEqual(serverScenarios["DE-A2-L01"]);
  });
  it("opens exactly the requested topic within the selected lesson", () => {
    for (const s of scenarios) {
      const url = new URL(lessonScenarioUrl("DE-A2-L01", s.id), "https://norskly.com");
      expect(url.searchParams.get("lesson")).toBe("DE-A2-L01");
      expect(selectedLessonScenario(scenarios, url.searchParams.get("scenario"))).toEqual(s);
    }
  });
  it("does not select topics absent from the authorized lesson response", () => {
    expect(selectedLessonScenario([], "S-01")).toBeNull();
    expect(selectedLessonScenario(scenarios, "RZ-01")).toBeNull();
  });
});