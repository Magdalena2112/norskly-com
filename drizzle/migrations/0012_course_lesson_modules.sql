ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS lesson_code text,
  ADD COLUMN IF NOT EXISTS intro_texts jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS modules jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS course_lessons_lesson_code_key ON public.course_lessons(lesson_code) WHERE lesson_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS course_lesson_progress_user_lesson_key ON public.course_lesson_progress(user_id, lesson_id);