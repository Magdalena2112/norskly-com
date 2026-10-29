import { describe, it, expect } from "vitest";
import { matchesEnrollment, belongsToEnrollment, filterStudentRecords, type Enrollment } from "./adminStudents";
const a: Enrollment = { id: "a", user_id: "u", language: "de", course_type: "general", level: "A2", onboarding_completed: true };
const b: Enrollment = { ...a, id: "b", course_type: "health", level: "B1" };
describe("admin course isolation", () => {
  it("shows both courses and their actual levels on one account", () => {
    expect(matchesEnrollment([a, b], "de", "health", "B1")).toBe(true);
    expect(matchesEnrollment([a, b], "de", "health", "A2")).toBe(false);
    expect(matchesEnrollment([], "all", "all", "A1")).toBe(false);
  });
  it("never attributes unscoped or another course's activity to the selected enrollment", () => {
    const lessons = [{ id: "health", language: "de", course: "health", cefr_level: "B1" }, { id: "general", language: "de", course: "general", cefr_level: "A2" }];
    expect(belongsToEnrollment({ language: "de", lesson_id: "health" }, b, lessons)).toBe(true);
    expect(belongsToEnrollment({ language: "de", lesson_id: "health" }, a, lessons)).toBe(false);
    expect(belongsToEnrollment({ language: "de" }, a, lessons)).toBe(false);
    expect(belongsToEnrollment({ language: "en", lesson_id: "general" }, a, lessons)).toBe(false);
  });
  it("includes all 120 historical errors by default without assigning them to a course", () => {
    const errors = Array.from({ length: 120 }, (_, id) => ({ id, language: "no", lesson_id: null }));
    expect(filterStudentRecords(errors, "no", "all", undefined, [])).toHaveLength(120);
    expect(filterStudentRecords(errors, "no", "unassigned", undefined, [])).toHaveLength(120);
    expect(filterStudentRecords(errors, "no", "course", { ...a, language: "no" }, [])).toHaveLength(0);
  });
  it("retains historical and current activity but keeps languages and course filters separate", () => {
    const lessons = [{ id: "health", language: "de", course: "health", cefr_level: "B1" }];
    const records = [{ id: 1, language: "de" }, { id: 2, language: "de", payload: { lesson_id: "health" } }, { id: 3, language: "en" }];
    expect(filterStudentRecords(records, "de", "all", a, lessons).map(r => r.id)).toEqual([1, 2]);
    expect(filterStudentRecords(records, "de", "unassigned", a, lessons).map(r => r.id)).toEqual([1]);
    expect(filterStudentRecords(records, "de", "course", b, lessons).map(r => r.id)).toEqual([2]);
  });
});