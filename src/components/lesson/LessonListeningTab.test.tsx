import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import LessonListeningTab from "./LessonListeningTab";
import lesson from "@/content/lessons/EN-A1-L01.json";
const { log, speak, stop } = vi.hoisted(() => ({ log: vi.fn(), speak: vi.fn(), stop: vi.fn() }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: { id: "test-user" } }) }));
vi.mock("@/lib/logActivity", () => ({ logActivity: log }));
vi.mock("@/lib/courseLessons", () => ({ speakLines: speak, stopSpeaking: stop }));
const scenes = lesson.modules.listening.scenes;
beforeEach(() => { vi.clearAllMocks(); Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {} }); });
afterEach(cleanup);
describe("Unified lesson listening", () => {
  it("contains ten unique audio-first variations with valid answers", () => {
    expect(scenes).toHaveLength(10);
    expect(new Set(scenes.map(s => s.code)).size).toBe(10);
    for (const s of scenes) {
      expect(s.lines.length).toBeGreaterThan(0);
      for (const line of s.lines) expect(line.text.trim().length).toBeGreaterThan(0);
      for (const q of s.questions) { expect(q.options).toContain(q.answer); expect(new Set(q.options).size).toBe(q.options.length); }
      expect(lesson.intro.some(t => JSON.stringify(t.lines) === JSON.stringify(s.lines))).toBe(false);
    }
  });
  it("preserves answers on navigation, uses requested speeds, completes all ten and deduplicates rewards", () => {
    const onDone = vi.fn();
    render(<LessonListeningTab scenes={scenes} lang="en" lessonCode={lesson.code} onDone={onDone} />);
    expect(screen.getAllByRole("button", { name: /^Aktivnost / })).toHaveLength(10);
    fireEvent.click(screen.getByRole("button", { name: "0.75x lagano" }));
    fireEvent.click(screen.getByRole("button", { name: "Slušaj" }));
    expect(speak).toHaveBeenLastCalledWith(scenes[0].lines, "en", expect.objectContaining({ rate: 0.75 }));
    for (let i = 0; i < scenes.length; i++) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`^Aktivnost ${i + 1}(,|$)`) }));
      expect(screen.queryByRole("button", { name: "Stop" })).toBeNull();
      const scene = scenes[i];
      for (let j = 0; j < scene.questions.length; j++) {
        fireEvent.click(screen.getByRole("button", { name: scene.questions[j].answer }));
        if (j < scene.questions.length - 1) fireEvent.click(screen.getByRole("button", { name: "Sledeće pitanje" }));
      }
      expect(screen.getByText(`Rezultat: ${scene.questions.length} / ${scene.questions.length}`)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Sakrij transkript" })).toBeInTheDocument();
    }
    expect(log).toHaveBeenCalledTimes(10);
    expect(onDone.mock.calls.map(c => c[0])).toEqual(scenes.map(s => s.code));
    expect(log).toHaveBeenCalledWith("test-user", "listening", "lesson_scene", expect.any(Number), expect.any(Object), expect.objectContaining({ language: "en" }));
    fireEvent.click(screen.getByRole("button", { name: "Aktivnost 1, završena" }));
    expect(screen.getByRole("button", { name: scenes[0].questions[4].answer })).toBeDisabled();
    expect(log).toHaveBeenCalledTimes(10);
  });
  it("does not award XP again for an activity already saved in lesson progress", () => {
    render(<LessonListeningTab scenes={scenes} lang="de" lessonCode={lesson.code} completed={[scenes[0].code]} />);
    for (let j = 0; j < scenes[0].questions.length; j++) {
      fireEvent.click(screen.getByRole("button", { name: scenes[0].questions[j].answer }));
      if (j < scenes[0].questions.length - 1) fireEvent.click(screen.getByRole("button", { name: "Sledeće pitanje" }));
    }
    expect(log).not.toHaveBeenCalled();
  });
});
