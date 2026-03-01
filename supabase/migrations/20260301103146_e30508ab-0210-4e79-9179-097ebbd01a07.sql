
-- Table for talk session history
CREATE TABLE public.talk_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  situation TEXT NOT NULL DEFAULT 'slobodno',
  formality TEXT NOT NULL DEFAULT 'opušten',
  role TEXT NOT NULL DEFAULT 'sagovornik',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  recap JSONB,
  message_count INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.talk_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own talk sessions"
  ON public.talk_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own talk sessions"
  ON public.talk_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own talk sessions"
  ON public.talk_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own talk sessions"
  ON public.talk_sessions FOR DELETE
  USING (auth.uid() = user_id);
