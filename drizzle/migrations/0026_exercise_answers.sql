CREATE TABLE public.exercise_answers (
  user_id uuid NOT NULL,
  answer_key text NOT NULL,
  scope text NOT NULL,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, answer_key)
);
CREATE INDEX exercise_answers_scope_idx ON public.exercise_answers (user_id, scope);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_answers TO authenticated;
GRANT ALL ON public.exercise_answers TO service_role;
ALTER TABLE public.exercise_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own answers select" ON public.exercise_answers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own answers insert" ON public.exercise_answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own answers update" ON public.exercise_answers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own answers delete" ON public.exercise_answers FOR DELETE TO authenticated USING (auth.uid() = user_id);