import type { CourseType } from "./courseAccess";

export type EnrollmentChoice = { language: string; course_type: string; level: string | null; onboarding_completed?: boolean };
export const courseKey = (e: EnrollmentChoice) => `${e.language}:${e.course_type}`;
export const courseSlug = (language: string) => language === "de" ? "nemacki" : language === "en" ? "engleski" : "norveski";
export const courseLabel = (e: EnrollmentChoice) => `${e.language === "de" ? "Nemački" : e.language === "en" ? "Engleski" : "Norveški"} · ${e.course_type === "health" ? "Zdravstveni" : "Opšti"} · ${e.level ?? ""}`;
export const coursePath = (e: EnrollmentChoice) => `/ucenje/${courseSlug(e.language)}?course=${e.course_type}`;

export function loginChoices(rows: EnrollmentChoice[], language?: string | null, course?: string | null) {
  return rows.filter(e => e.onboarding_completed && (!language || e.language === language) && (!course || e.course_type === course));
}

/** Selection is navigation intent only; database enrollment still authorizes access. */
export function getSelectedCourse(language: string): CourseType {
  if (typeof window === "undefined") return "general";
  const query = new URLSearchParams(window.location.search).get("course");
  const value = query ?? localStorage.getItem(`norskly_course_${language}`);
  return value === "health" && language !== "en" ? "health" : "general";
}

export function selectCourse(language: string, course: string) {
  localStorage.setItem(`norskly_course_${language}`, course);
  localStorage.setItem("norskly_selected_language", courseSlug(language));
  window.dispatchEvent(new Event("language-changed"));
  window.dispatchEvent(new Event("course-changed"));
}