
CREATE TABLE public.grammar_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  session_type text NOT NULL DEFAULT 'exercise',
  topic text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  user_answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0
);

ALTER TABLE public.grammar_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own grammar sessions"
  ON public.grammar_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own grammar sessions"
  ON public.grammar_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own grammar sessions"
  ON public.grammar_sessions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
