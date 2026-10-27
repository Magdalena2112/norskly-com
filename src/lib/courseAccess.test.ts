import { describe, expect, it } from "vitest";
import { courseIntent, courseMatches, courseStartLevel } from "./courseAccess";
describe("isolated course access", () => {
  it("health enrollment cannot open general lessons", () => { expect(courseMatches("health", "general")).toBe(false); });
  it("general enrollment cannot open health lessons", () => { expect(courseMatches("general", "health")).toBe(false); });
  it("enrolled courses remain available", () => { expect(courseMatches("health", "health")).toBe(true); expect(courseMatches("general", "general")).toBe(true); });
  it("no enrollment grants no access", () => { expect(courseMatches(null, "general")).toBe(false); });
  it("health registration is supported for Norwegian and German only", () => { expect(courseIntent("health", "no")).toBe("health"); expect(courseIntent("health", "de")).toBe("health"); expect(courseIntent("health", "en")).toBe("general"); });
  it("general courses accept each selected level from A1 to C1", () => {
    for (const level of ["A1", "A2", "B1", "B2", "C1"]) expect(courseStartLevel(level, "general")).toBe(level);
  });
  it("health courses start at B1 even if an unavailable level is supplied", () => {
    for (const level of ["A1", "A2", "B1", "B2", "C1", null]) expect(courseStartLevel(level, "health")).toBe("B1");
  });
  it("direct general registration without a valid level defaults to A1", () => {
    expect(courseStartLevel(null, "general")).toBe("A1");
    expect(courseStartLevel("invalid", "general")).toBe("A1");
  });
});