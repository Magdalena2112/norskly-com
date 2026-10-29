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
import { isRecommendedTeacher, sortByRecommendation, validateTeacherOffer } from "./teacherVisibility";
describe("teacher recommendations", () => {
  it("recommends general teacher teaching the student's level", () => {
    expect(isRecommendedTeacher({ teaching_levels: ["A2"], course_types: ["general"] }, "general", "A2")).toBe(true);
    expect(isRecommendedTeacher({ teaching_levels: ["B1"], course_types: ["general"] }, "general", "A2")).toBe(false);
    expect(isRecommendedTeacher({ teaching_levels: ["A2"], course_types: ["health"] }, "general", "A2")).toBe(false);
  });
  it("health recommendation needs admin approval", () => {
    expect(isRecommendedTeacher({ teaching_levels: ["B1"], course_types: ["health"], healthcare_approved: false }, "health", "B1")).toBe(false);
    expect(isRecommendedTeacher({ teaching_levels: ["B1"], course_types: ["health"], healthcare_approved: true }, "health", "B1")).toBe(true);
  });
  it("puts recommended first but keeps all", () => {
    expect(sortByRecommendation([1, 2, 3], n => n === 3)).toEqual([3, 1, 2]);
  });
  it("requires level and course type", () => {
    expect(validateTeacherOffer([], ["general"])).not.toBeNull();
    expect(validateTeacherOffer(["A1"], [])).not.toBeNull();
    expect(validateTeacherOffer(["A1"], ["general"])).toBeNull();
  });
});
