import { describe, it, expect } from "vitest";
import { loginChoices, coursePath } from "./courseSelection";

const rows = [
  {language:"de",course_type:"general",level:"A2",onboarding_completed:true},
  {language:"de",course_type:"health",level:"B1",onboarding_completed:true},
  {language:"no",course_type:"general",level:"A2",onboarding_completed:false},
];
describe("course login selection", () => {
  it("offers both enrolled German courses for general login", () => {
    expect(loginChoices(rows).map(e => e.course_type)).toEqual(["general","health"]);
  });
  it("opens the specifically requested healthcare B1 rather than general A2", () => {
    const selected=loginChoices(rows,"de","health");
    expect(selected).toHaveLength(1);
    expect(selected[0].level).toBe("B1");
    expect(coursePath(selected[0])).toBe("/ucenje/nemacki?course=health");
  });
  it("does not grant enrollment from course intent", () => {
    expect(loginChoices(rows,"no","health")).toEqual([]);
  });
  it("goes directly when exactly one course is completed", () => {
    expect(loginChoices([rows[0],rows[2]])).toHaveLength(1);
  });
});