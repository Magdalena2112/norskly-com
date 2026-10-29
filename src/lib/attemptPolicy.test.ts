import { describe, it, expect } from "vitest";
import { maxAttempts } from "./attemptPolicy";
describe("maxAttempts", () => {
  it("true/false gets 1", () => expect(maxAttempts({ type: "truefalse", optionCount: 2 })).toBe(1));
  it("two options get 1", () => expect(maxAttempts({ optionCount: 2 })).toBe(1));
  it("multiple choice gets 2", () => expect(maxAttempts({ type: "choice", optionCount: 4 })).toBe(2));
  it("item with 3+ options gets 2", () => expect(maxAttempts({ optionCount: 3 })).toBe(2));
  it("typing gets 3", () => expect(maxAttempts({})).toBe(3));
  it("gaps/order/match get 3", () => ["gaps", "order", "match", "text"].forEach((t) => expect(maxAttempts({ type: t })).toBe(3)));
});
