import { CEFR_LEVELS, type CefrLevel } from "./levels";

export type CourseType = "general" | "health";
export function courseStartLevel(value: unknown, course: CourseType): CefrLevel {
  if (course === "health") return "B1";
  return CEFR_LEVELS.find((level) => level === value) ?? "A1";
}
export function courseIntent(value: string | null | undefined, language: string): CourseType {
  return value === "health" && (language === "no" || language === "de") ? "health" : "general";
}
export function courseMatches(enrolled: CourseType | null, lesson: string): boolean {
  return enrolled !== null && enrolled === lesson;
}