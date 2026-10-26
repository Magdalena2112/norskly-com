// Structured grammar practice items (type + xp) used by lesson grammar tabs.
// Grading is pure so it can be tested; answers are compared ignoring only
// initial capitalisation, end punctuation and extra spaces — never word order.

export type PracticeType = "choice" | "multi" | "truefalse" | "order" | "gaps" | "text" | "match";

export interface PracticeExercise {
  id: string; code: string; title: string; instruction: string; type: PracticeType; xp: number;
  grammarFocus?: string; hint?: string; hint2?: string; explanation?: string;
  context?: string; prompt?: string;
  options?: string[]; correct?: number[];
  tokens?: string[]; answer?: string[];
  text?: string; gaps?: { options: string[]; answer: string }[];
  inputs?: { prompt: string; answers: string[] }[];
  left?: string[]; right?: string[]; pairs?: number[];
}

export function normSentence(s: string) {
  return s
    .replace(/[’‘`´]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*[.!?]+$/, "")
    .replace(/\s+([?!.,])/g, "$1")
    .replace(/^./, (c) => c.toLowerCase());
}

export function sameSentence(a: string, b: string) {
  return !!normSentence(a) && normSentence(a) === normSentence(b);
}

export type PracticeValue = number[] | string[];

export function gradePractice(ex: PracticeExercise, value: PracticeValue): boolean {
  switch (ex.type) {
    case "choice":
    case "truefalse":
    case "multi": {
      const v = [...(value as number[])].sort();
      const c = [...(ex.correct || [])].sort();
      return v.length === c.length && v.every((x, i) => x === c[i]);
    }
    case "order":
      return (ex.answer || []).some((a) => sameSentence((value as string[]).join(" "), a));
    case "gaps":
      return (ex.gaps || []).every((g, i) => (value as string[])[i] === g.answer);
    case "text":
      return (ex.inputs || []).every((inp, i) => inp.answers.some((a) => sameSentence((value as string[])[i] || "", a)));
    case "match":
      return (ex.pairs || []).every((p, i) => (value as number[])[i] === p);
  }
  return false;
}

/** XP earned = sum of xp for completed practice codes (each counted once). */
export function earnedXp(exercises: { code: string; xp?: number }[], done: string[]) {
  const set = new Set(done);
  return exercises.reduce((s, e) => s + (e.xp && set.has(e.code) ? e.xp : 0), 0);
}
