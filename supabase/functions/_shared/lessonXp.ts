export const LESSON_XP = { grammar: 40, vocabulary: 20, pronunciation: 10, listening: 10, writing: 20 } as const;

/** Integer allocations in authoring order, never a score-derived or daily bonus. */
export function allocateXp(total: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => Math.floor(total / count) + (i < total % count ? 1 : 0));
}

export function withLessonXp<T>(lesson: T): T {
  const result = JSON.parse(JSON.stringify(lesson));
  for (const [module, content] of Object.entries(result.modules) as [string, any][]) {
    const items = module === "listening" ? content.scenes || [] : content.exercises || [];
    const total = LESSON_XP[module as keyof typeof LESSON_XP] ?? 0;
    const points = allocateXp(total, items.length);
    items.forEach((item: any, i: number) => { item.xp = points[i]; });
    if (module === "review" && content.quiz) content.quiz.bonusXp = 0;
  }
  return result;
}