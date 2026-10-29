import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LessonExercise from "./LessonExercise";
import a1 from "@/content/lessons/EN-A1-L01.json";
import a2 from "@/content/lessons/EN-A2-L01.json";
import type { Exercise } from "@/lib/courseLessons";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke } } }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/lib/logErrors", () => ({ logErrors: vi.fn() }));
vi.mock("@/content/lessons/itemImages", () => ({ ITEM_IMAGES: {} }));
vi.mock("@/components/writing/CorrectionResultView", () => ({ default: () => null }));

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

function mount(exercise: Exercise) {
  const onDone = vi.fn();
  render(<LessonExercise exercise={exercise} language="en" level="A2" lessonTitle="Lesson 1" done={false} onDone={onDone} />);
  return onDone;
}

describe("Lesson exercise grading", () => {
  it("checks MIX-14's six days answer using its question and guide, not the essay grader", async () => {
    const exercise = a2.modules.grammar.exercises.find(e => e.code === "MIX-14");
    if (!exercise) throw new Error("Missing MIX-14 fixture");
    invoke.mockResolvedValue({ data: { results: [{ index: 0, verdict: "correct", feedback: "Tačno!" }] }, error: null });
    const onDone = mount(exercise);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "six days" } });
    fireEvent.click(screen.getByRole("button", { name: "Proveri" }));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith("MIX-14"));
    expect(invoke).toHaveBeenCalledExactlyOnceWith("lesson-check", {
      body: {
        language: "en", level: "A2", lessonTitle: "Lesson 1", lessonCode: undefined, course: "general",
        exercise: { code: "MIX-14", title: exercise.title, instruction: exercise.instruction },
        items: [{ prompt: "How many days is the exhibition running?", answer: "six days", guide: "Odgovor: six days (from Tuesday to Sunday)" }],
      },
    });
  });

  const writing = [a1, a2].flatMap(lesson => lesson.modules.writing.exercises
    .filter(e => e.kind === "open" && e.items.length === 1 && e.items[0].open)
    .map(exercise => ({ code: `${lesson.code}-${exercise.code}`, exercise })));

  it.each(writing)("preserves the writing grader for $code", async ({ exercise }) => {
    invoke.mockResolvedValue({ data: { mistakes: [], overall_feedback: "Dobro!", corrected_text: "I work in London." }, error: null });
    const onDone = mount(exercise);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "I work in London." } });
    fireEvent.click(screen.getByRole("button", { name: "Proveri" }));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith(exercise.code));
    expect(invoke).toHaveBeenCalledExactlyOnceWith("writing-correct", {
      body: {
        text: "I work in London.", language: "en", level: "A2", course: "general", has_image: "image" in exercise && !!exercise.image,
        topic: { title: exercise.title, guiding_questions: "guiding" in exercise.items[0] ? exercise.items[0].guiding : [] },
      },
    });
  });
});