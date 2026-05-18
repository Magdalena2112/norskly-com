CREATE TABLE public.reading_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  level text NOT NULL,
  topic text NOT NULL,
  length text NOT NULL,
  title text NOT NULL DEFAULT '',
  text text NOT NULL DEFAULT '',
  vocabulary jsonb NOT NULL DEFAULT '[]'::jsonb,
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  user_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  feedback jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reading sessions" ON public.reading_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reading sessions" ON public.reading_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reading sessions" ON public.reading_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reading sessions" ON public.reading_sessions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all reading sessions" ON public.reading_sessions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin_teacher'::app_role));
CREATE POLICY "Teachers with consent can view student reading" ON public.reading_sessions
  FOR SELECT TO authenticated USING (is_teacher_of_student(user_id));

CREATE TRIGGER update_reading_sessions_updated_at
  BEFORE UPDATE ON public.reading_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_reading_sessions_user_created ON public.reading_sessions(user_id, created_at DESC);