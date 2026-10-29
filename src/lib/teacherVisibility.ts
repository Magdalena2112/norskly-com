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