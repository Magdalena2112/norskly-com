import { CEFR_LEVELS, type CefrLevel } from "./levels";

export type CourseType = "general" | "health";

// Nivoi aktivni u promotivnom periodu, po jeziku i vrsti kursa.
// null znači da su svi CEFR nivoi dostupni.
const PROMO_LEVELS: Record<string, Partial<Record<CourseType, CefrLevel[]>>> = {
  en: { general: ["A2"] },
};

export function promoAvailableLevels(language: string, course: CourseType): CefrLevel[] | null {
  return PROMO_LEVELS[language]?.[course] ?? null;
}

export function courseStartLevel(value: unknown, course: CourseType, allowed?: CefrLevel[] | null): CefrLevel {
  if (course === "health") return "B1";
  if (allowed?.length) return allowed.find((level) => level === value) ?? allowed[0];
  return CEFR_LEVELS.find((level) => level === value) ?? "A1";
}
export function courseIntent(value: string | null | undefined, language: string): CourseType {
  return value === "health" && (language === "no" || language === "de") ? "health" : "general";
}
export function courseMatches(enrolled: CourseType | null, lesson: string): boolean {
  return enrolled !== null && enrolled === lesson;
}