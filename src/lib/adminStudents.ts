export interface Enrollment {
  id: string; user_id: string; language: string; course_type: string;
  level: string | null; onboarding_completed: boolean;
}
export const languageName = (code: string) => ({ no: "Norveški", en: "Engleski", de: "Nemački" }[code] || code);
export const courseName = (course: string) => course === "general" ? "Opšti kurs" : course === "health" ? "Zdravstveni kurs" : course === "legacy" ? "Raniji profil (sve aktivnosti)" : course;
export const enrollmentName = (e: Enrollment) => `${languageName(e.language)} · ${courseName(e.course_type)} · ${e.level || "Nivo nije izabran"}`;

export function matchesEnrollment(enrollments: Enrollment[], language: string, course: string, level: string) {
  return (language === "all" && course === "all" && level === "all") || enrollments.some(e =>
    (language === "all" || e.language === language) && (course === "all" || e.course_type === course) && (level === "all" || e.level === level));
}

export function belongsToEnrollment(
  record: { language: string; lesson_id?: string | null; payload?: unknown },
  enrollment: Enrollment,
  lessons: { id: string; language: string; course: string; cefr_level: string }[],
) {
  const payload = record.payload as { lesson_id?: string } | null;
  const id = record.lesson_id || payload?.lesson_id;
  return record.language === enrollment.language && lessons.some(l => l.id === id && l.language === enrollment.language &&
    l.course === enrollment.course_type && (l.course !== "general" || l.cefr_level === enrollment.level));
}

export type StudentRecord = { language: string; lesson_id?: string | null; payload?: unknown };
type LessonMetadata = { id: string; language: string; course: string; cefr_level: string };

export function filterStudentRecords<T extends StudentRecord>(
  records: T[], language: string, scope: "all" | "unassigned" | "course",
  enrollment: Enrollment | undefined, lessons: LessonMetadata[],
) {
  return records.filter(record => {
    if (record.language !== language) return false;
    if (scope === "all") return true;
    if (scope === "course") return !!enrollment && belongsToEnrollment(record, enrollment, lessons);
    const payload = record.payload as { lesson_id?: string } | null;
    const id = record.lesson_id || payload?.lesson_id;
    return !lessons.some(lesson => lesson.id === id && lesson.language === language);
  });
}

export function studentRecordLabel(record: StudentRecord, lessons: (LessonMetadata & { title: string })[]) {
  const payload = record.payload as { lesson_id?: string } | null;
  const lesson = lessons.find(l => l.id === (record.lesson_id || payload?.lesson_id) && l.language === record.language);
  return lesson ? `${courseName(lesson.course)} · ${lesson.cefr_level} · ${lesson.title}` : "Bez dodeljenog kursa · ranije ili samostalno vežbanje";
}