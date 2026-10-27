import type { PracticeExercise } from "@/lib/grammarPractice";

export interface VocabularyPracticeExercise extends PracticeExercise {
  kind: "vocabulary";
  items: [];
  vocabularyFocus: string;
  image?: string;
  leftImages?: string[];
}

export function vocabularyDedupKey(lessonId: string, code: string) {
  return `lesson-vocabulary:${lessonId}:${code}`;
}

export function vocabularyXp(exercises: VocabularyPracticeExercise[], awardedCodes: string[]) {
  const awarded = new Set(awardedCodes);
  return exercises.reduce((total, ex) => total + (awarded.has(ex.code) ? ex.xp : 0), 0);
}