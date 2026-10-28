import { supabase } from "@/integrations/supabase/client";

export async function completeLessonExercise(lessonId: string, code: string) {
  const { data, error } = await supabase.rpc("complete_lesson_exercise", { _lesson_id: lessonId, _code: code });
  if (error) throw error;
  return data;
}