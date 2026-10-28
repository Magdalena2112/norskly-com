import type { TalkScenario } from "@/content/lessons/talkScenarios";

export function lessonScenarioUrl(lessonCode: string, scenarioId: string) {
  return `/talk?${new URLSearchParams({ lesson: lessonCode, scenario: scenarioId })}`;
}

export function selectedLessonScenario(scenarios: TalkScenario[], scenarioId: string | null) {
  return scenarios.find((scenario) => scenario.id === scenarioId) ?? null;
}