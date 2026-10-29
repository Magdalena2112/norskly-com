import { fireEvent, render, screen, cleanup, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import LessonListeningTab, { type ListeningScene } from "./LessonListeningTab";
import lesson from "@/content/lessons/EN-A1-L01.json";
import enA2 from "@/content/lessons/EN-A2-L01.json";
import noA2 from "@/content/lessons/NO-A2-L01.json";
import deA2 from "@/content/lessons/DE-A2-L01.json";
import noB1 from "@/content/lessons/NO-HC-B1-L01.json";
import deB1 from "@/content/lessons/DE-HC-B1-L01.json";
const { log, speak, stop, errorToast } = vi.hoisted(() => ({ log: vi.fn(), speak: vi.fn(), stop: vi.fn(), errorToast: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: errorToast } }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: { id: "test-user" } }) }));
vi.mock("@/lib/logActivity", () => ({ logActivity: log }));
vi.mock("@/lib/courseLessons", () => ({ speakLines: speak, stopSpeaking: stop }));
const scenes = lesson.modules.listening.scenes;
beforeEach(() => { vi.clearAllMocks(); log.mockResolvedValue({ points_awarded: 1 }); Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {} }); });
afterEach(cleanup);
describe("Unified lesson listening", () => {
  it.each([
    [lesson, "en"], [enA2, "en"], [noA2, "no"],
    [deA2, "de"], [noB1, "no"], [deB1, "de"],
  ] as const)("keeps final answers and sends canonical reward codes for lesson %#", async (content, lang) => {
    log.mockImplementation(async (_user, _module, _type, _xp, payload) => {
      const pattern = content.code === "EN-A1-L01"
        ? /^LI-(0[1-9]|10)$/
        : new RegExp(`^${content.code}-L(0[1-9]|10)$`);
      if (!pattern.test(String(payload.code || payload.scene))) throw new Error("Invalid rewarded exercise");
      return { points_awarded: 0 };
    });
    const onDone = vi.fn();
    const activities: ListeningScene[] = content.modules.listening.scenes;
    render(<LessonListeningTab scenes={activities} lang={lang} lessonCode={content.code} onDone={onDone} />);
    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`^Aktivnost ${i + 1}(,|$)`) }));
      for (let j = 0; j < activity.questions.length; j++) {
        fireEvent.click(screen.getByRole("button", { name: activity.questions[j].answer }));
        if (j < activity.questions.length - 1) fireEvent.click(screen.getByRole("button", { name: "Sledeće pitanje" }));
      }
      await waitFor(() => expect(log).toHaveBeenCalledTimes(i + 1));
      expect(log).toHaveBeenLastCalledWith("test-user", "listening", "lesson_scene", activity.xp ?? 1,
        expect.objectContaining({ code: activity.code, scene: activity.id }),
        expect.objectContaining({ dedupKey: `lesson_listen_${content.code}_${activity.code}_${lang}`, language: lang }));
      expect(screen.getByRole("button", { name: activity.questions[activity.questions.length - 1].answer })).toBeDisabled();
      expect(screen.getByText(`Rezultat: ${activity.questions.length} / ${activity.questions.length}`)).toBeInTheDocument();
      expect(errorToast).not.toHaveBeenCalled();
    }
    expect(onDone.mock.calls.map(call => call[0])).toEqual(activities.map(activity => activity.code));
  });
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
    expect(log).toHaveBeenCalledWith("test-user", "listening", "lesson_scene", 1, expect.any(Object), expect.objectContaining({ language: "en" }));
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
