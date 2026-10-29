/** How many tries a learner gets before the item locks and the mistake explanation opens. */
export function maxAttempts(kind: { type?: string; optionCount?: number }): number {
  const { type, optionCount } = kind;
  if (type === "truefalse") return 1;
  if (optionCount !== undefined && optionCount <= 2) return 1;
  if (type === "choice" || type === "multi" || (type === undefined && optionCount !== undefined)) return 2;
  return 3; // typing, gaps, ordering, matching
}
