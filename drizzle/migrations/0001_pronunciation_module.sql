CREATE TABLE public.pronunciation_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  cefr_level text NOT NULL DEFAULT 'A1',
  category text NOT NULL,
  activity_type text NOT NULL,
  topic text NOT NULL DEFAULT 'opšte',
  target_text text NOT NULL DEFAULT '',
  phonetic_transcription text,
  pronunciation_hint text,
  pronunciation_tip text,
  audio_url text,
  slow_audio_url text,
  example_words jsonb NOT NULL DEFAULT '[]'::jsonb,
  stress_data jsonb,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  duration_seconds integer NOT NULL DEFAULT 180,
  difficulty smallint NOT NULL DEFAULT 1,
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  course_id uuid,
  chapter_id uuid,
  lesson_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pronunciation_activities TO authenticated;
GRANT ALL ON public.pronunciation_activities TO service_role;
ALTER TABLE public.pronunciation_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read published pronunciation" ON public.pronunciation_activities FOR SELECT TO authenticated
  USING (is_published OR public.has_role(auth.uid(), 'admin'));
GRANT INSERT, UPDATE, DELETE ON public.pronunciation_activities TO authenticated;
CREATE POLICY "Admins manage pronunciation" ON public.pronunciation_activities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX pronunciation_activities_lang_level_idx ON public.pronunciation_activities(language, cefr_level, sort_order);
CREATE TRIGGER pronunciation_activities_updated_at BEFORE UPDATE ON public.pronunciation_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.pronunciation_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_id uuid NOT NULL REFERENCES public.pronunciation_activities(id) ON DELETE CASCADE,
  language text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  score integer,
  practiced_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  attempts integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, activity_id)
);
GRANT SELECT, INSERT, UPDATE ON public.pronunciation_progress TO authenticated;
GRANT ALL ON public.pronunciation_progress TO service_role;
ALTER TABLE public.pronunciation_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own pronunciation progress select" ON public.pronunciation_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.is_teacher_of_student(user_id));
CREATE POLICY "Own pronunciation progress insert" ON public.pronunciation_progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own pronunciation progress update" ON public.pronunciation_progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER pronunciation_progress_updated_at BEFORE UPDATE ON public.pronunciation_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_module_check;
ALTER TABLE public.activities ADD CONSTRAINT activities_module_check
  CHECK (module = ANY (ARRAY['grammar','vocabulary','talk','quiz','listening','pronunciation']));