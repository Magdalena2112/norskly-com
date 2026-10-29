import GrammarPracticeExercise from "./GrammarPracticeExercise";
import type { VocabularyPracticeExercise as Exercise } from "@/lib/vocabularyPractice";

export default function VocabularyPracticeExercise({ exercise, done, onDone, pictures, language }: {
  exercise: Exercise; done: boolean; onDone: (code: string) => void; pictures: Record<string, string>;
  language?: "no" | "en" | "de";
}) {
  return <GrammarPracticeExercise exercise={exercise} done={done} onDone={onDone} vocabulary language={language}
    images={{ prompt: exercise.image ? pictures[exercise.image] : undefined, left: exercise.leftImages?.map((key) => pictures[key]) }} />;
}