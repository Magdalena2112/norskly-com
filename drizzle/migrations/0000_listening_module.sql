CREATE TABLE public.listening_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  cefr_level text NOT NULL,
  topic text NOT NULL,
  activity_type text NOT NULL,
  audio_url text,
  transcript text NOT NULL DEFAULT '',
  segments jsonb NOT NULL DEFAULT '[]'::jsonb,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  duration_seconds integer NOT NULL DEFAULT 60,
  difficulty smallint NOT NULL DEFAULT 1,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  course_id uuid,
  chapter_id uuid,
  lesson_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listening_activities TO authenticated;
GRANT ALL ON public.listening_activities TO service_role;
ALTER TABLE public.listening_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read published listening" ON public.listening_activities FOR SELECT TO authenticated USING (is_published OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage listening" ON public.listening_activities FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE INDEX idx_listening_activities_lang ON public.listening_activities(language, cefr_level);
CREATE TRIGGER trg_listening_activities_updated_at BEFORE UPDATE ON public.listening_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.listening_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_id uuid NOT NULL REFERENCES public.listening_activities(id) ON DELETE CASCADE,
  language text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempts integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, activity_id)
);
GRANT SELECT, INSERT, UPDATE ON public.listening_progress TO authenticated;
GRANT ALL ON public.listening_progress TO service_role;
ALTER TABLE public.listening_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own listening progress select" ON public.listening_progress FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin') OR is_teacher_of_student(user_id));
CREATE POLICY "Own listening progress insert" ON public.listening_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own listening progress update" ON public.listening_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_listening_progress_updated_at BEFORE UPDATE ON public.listening_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();