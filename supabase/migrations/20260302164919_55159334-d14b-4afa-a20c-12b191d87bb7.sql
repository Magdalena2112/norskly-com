
CREATE TABLE public.error_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  module text NOT NULL,
  source_type text NOT NULL,
  category text NOT NULL,
  topic text NOT NULL,
  severity smallint NOT NULL DEFAULT 1,
  example_wrong text NOT NULL,
  example_correct text NOT NULL,
  context text,
  attempt_no smallint
);

ALTER TABLE public.error_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own error events"
ON public.error_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own error events"
ON public.error_events FOR SELECT
USING (auth.uid() = user_id);

CREATE INDEX idx_error_events_user_module ON public.error_events (user_id, module);
CREATE INDEX idx_error_events_category ON public.error_events (user_id, category);
