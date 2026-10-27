import { describe, expect, it } from "vitest";
import { courseIntent, courseMatches } from "./courseAccess";
describe("isolated course access", () => {
  it("health enrollment cannot open general lessons", () => { expect(courseMatches("health", "general")).toBe(false); });
  it("general enrollment cannot open health lessons", () => { expect(courseMatches("general", "health")).toBe(false); });
  it("enrolled courses remain available", () => { expect(courseMatches("health", "health")).toBe(true); expect(courseMatches("general", "general")).toBe(true); });
  it("no enrollment grants no access", () => { expect(courseMatches(null, "general")).toBe(false); });
  it("health registration is supported for Norwegian and German only", () => { expect(courseIntent("health", "no")).toBe("health"); expect(courseIntent("health", "de")).toBe("health"); expect(courseIntent("health", "en")).toBe("general"); });
});