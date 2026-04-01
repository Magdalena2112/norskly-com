
CREATE TABLE public.saved_explanations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  query text NOT NULL,
  explanation_data jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.saved_explanations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved explanations"
  ON public.saved_explanations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved explanations"
  ON public.saved_explanations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved explanations"
  ON public.saved_explanations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
