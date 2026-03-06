ALTER TABLE public.talk_sessions 
ADD COLUMN IF NOT EXISTS title text DEFAULT '',
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();