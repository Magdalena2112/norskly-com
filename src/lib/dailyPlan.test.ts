import { describe, it, expect } from "vitest";
import { dailyPace, dailyProgress } from "./dailyPlan";

describe("dailyPace", () => {
  it("15 min = 1 module, 20 XP", () => expect(dailyPace(15)).toMatchObject({ modulesPerDay: 1, xpGoal: 20 }));
  it("30 min = 3 modules, 40 XP", () => expect(dailyPace(30)).toMatchObject({ modulesPerDay: 3, xpGoal: 40 }));
  it("60 min = whole lesson, 100 XP", () => expect(dailyPace(60)).toMatchObject({ modulesPerDay: 9, xpGoal: 100 }));
  it("missing choice falls back to 30 min", () => expect(dailyPace(null).minutes).toBe(30));
});

describe("dailyProgress", () => {
  it("counts XP left to goal", () => expect(dailyProgress(25, dailyPace(30))).toMatchObject({ left: 15, done: false }));
  it("marks goal done", () => expect(dailyProgress(45, dailyPace(30)).done).toBe(true));
});
