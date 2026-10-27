export type CourseType = "general" | "health";
export function courseIntent(value: string | null | undefined, language: string): CourseType {
  return value === "health" && (language === "no" || language === "de") ? "health" : "general";
}
export function courseMatches(enrolled: CourseType | null, lesson: string): boolean {
  return enrolled !== null && enrolled === lesson;
}