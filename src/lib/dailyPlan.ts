// Daily pacing derived from the onboarding time choice (language_profiles.daily_minutes).
export type DailyPace = { minutes: 15 | 30 | 60; label: string; modulesPerDay: number; xpGoal: number; lessonDays: string };

const PACES: Record<15 | 30 | 60, DailyPace> = {
  15: { minutes: 15, label: "Lagani ritam", modulesPerDay: 1, xpGoal: 20, lessonDays: "~9–10 dana" },
  30: { minutes: 30, label: "Optimalni ritam", modulesPerDay: 3, xpGoal: 40, lessonDays: "~4–5 dana" },
  60: { minutes: 60, label: "Intenzivni ritam", modulesPerDay: 9, xpGoal: 100, lessonDays: "~1–2 dana" },
};

export function dailyPace(minutes: number | null | undefined): DailyPace {
  return PACES[(minutes === 15 || minutes === 60 ? minutes : 30) as 15 | 30 | 60];
}

export function dailyProgress(xpToday: number, pace: DailyPace) {
  const xp = Math.max(0, xpToday);
  return { ratio: Math.min(xp / pace.xpGoal, 1), done: xp >= pace.xpGoal, left: Math.max(pace.xpGoal - xp, 0) };
}
