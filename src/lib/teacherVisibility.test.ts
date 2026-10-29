import { describe, expect, it } from "vitest";
import { visibleForCourse } from "./teacherVisibility";

const teacher = { is_active: true, language: "no", teaching_languages: ["no", "de"] };
const offers = [{ language: "no", is_active: true }, { language: "de", is_active: true }];
describe("Teacher course visibility", () => {
  it("automatically includes general teachers with active offers", () => {
    expect(visibleForCourse(teacher, "de", "general", offers, [])).toBe(true);
    expect(visibleForCourse(teacher, "de", "general", [], [])).toBe(false);
  });
  it("requires healthcare approval", () => {
    expect(visibleForCourse(teacher, "no", "health", offers, [])).toBe(false);
    expect(visibleForCourse(teacher, "no", "health", offers, ["no"])).toBe(true);
  });
  it("isolates approvals by language", () => {
    expect(visibleForCourse(teacher, "de", "health", offers, ["no"])).toBe(false);
    expect(visibleForCourse(teacher, "en", "general", offers, ["en"])).toBe(false);
  });
  it("excludes paused teachers and inactive offers", () => {
    expect(visibleForCourse({ ...teacher, is_active: false }, "no", "health", offers, ["no"])).toBe(false);
    expect(visibleForCourse(teacher, "no", "general", [{ language: "no", is_active: false }], [])).toBe(false);
  });
});