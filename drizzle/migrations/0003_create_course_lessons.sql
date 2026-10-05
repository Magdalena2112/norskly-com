CREATE TABLE public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language text NOT NULL,
  cefr_level text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  title_target text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  goals jsonb NOT NULL DEFAULT '[]'::jsonb,
  illustration_url text,
  text_title text NOT NULL DEFAULT '',
  text_segments jsonb NOT NULL DEFAULT '[]'::jsonb,
  vocabulary jsonb NOT NULL DEFAULT '[]'::jsonb,
  grammar jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_note text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX course_lessons_lang_level_idx ON public.course_lessons(language, cefr_level, sort_order);
GRANT SELECT ON public.course_lessons TO authenticated;
GRANT ALL ON public.course_lessons TO service_role;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read published lessons" ON public.course_lessons FOR SELECT TO authenticated USING (is_published OR public.has_role(auth.uid(), 'admin_teacher'));
CREATE TRIGGER course_lessons_updated_at BEFORE UPDATE ON public.course_lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.course_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  language text NOT NULL,
  completed_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'in_progress',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE ON public.course_lesson_progress TO authenticated;
GRANT ALL ON public.course_lesson_progress TO service_role;
ALTER TABLE public.course_lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own lesson progress select" ON public.course_lesson_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own lesson progress insert" ON public.course_lesson_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own lesson progress update" ON public.course_lesson_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER course_lesson_progress_updated_at BEFORE UPDATE ON public.course_lesson_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();