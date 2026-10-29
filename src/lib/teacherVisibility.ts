export type TeacherVisibility = {
  is_active: boolean;
  language: string;
  teaching_languages: string[];
};

export function visibleForCourse(
  teacher: TeacherVisibility,
  language: string,
  course: string,
  offers: { language: string; is_active: boolean }[],
  approvedLanguages: string[],
) {
  const languages = teacher.teaching_languages.length ? teacher.teaching_languages : [teacher.language];
  return teacher.is_active && languages.includes(language)
    && offers.some(offer => offer.language === language && offer.is_active)
    && (course === "general" || (course === "health" && approvedLanguages.includes(language)));
}
export const TEACHING_LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;

/** A teacher is recommended when they teach the student's level and the course type (health also needs admin approval). */
export function isRecommendedTeacher(
  teacher: { teaching_levels?: string[] | null; course_types?: string[] | null; healthcare_approved?: boolean },
  course: string,
  level: string | null | undefined,
) {
  if (!level || !teacher.teaching_levels?.includes(level)) return false;
  if (course === "health") return !!teacher.healthcare_approved;
  return (teacher.course_types ?? ["general"]).includes("general");
}

export function sortByRecommendation<T>(teachers: T[], isRec: (t: T) => boolean) {
  return [...teachers].sort((a, b) => Number(isRec(b)) - Number(isRec(a)));
}

export function validateTeacherOffer(levels: string[], courseTypes: string[]) {
  if (!levels.length) return "Izaberi bar jedan nivo koji podučavaš.";
  if (!courseTypes.length) return "Izaberi bar jedan tip kursa.";
  return null;
}
