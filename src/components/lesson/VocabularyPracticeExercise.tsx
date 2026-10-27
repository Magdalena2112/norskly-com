import GrammarPracticeExercise from "./GrammarPracticeExercise";
import type { VocabularyPracticeExercise as Exercise } from "@/lib/vocabularyPractice";

export default function VocabularyPracticeExercise({ exercise, done, onDone, pictures }: {
  exercise: Exercise; done: boolean; onDone: (code: string) => void; pictures: Record<string, string>;
}) {
  return <GrammarPracticeExercise exercise={exercise} done={done} onDone={onDone} vocabulary
    images={{ prompt: exercise.image ? pictures[exercise.image] : undefined, left: exercise.leftImages?.map((key) => pictures[key]) }} />;
}