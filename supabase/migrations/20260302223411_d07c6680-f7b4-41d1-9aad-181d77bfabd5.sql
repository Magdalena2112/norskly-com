
-- User XP tracking table
CREATE TABLE public.user_xp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  total_xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  last_daily_bonus_date date DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own xp" ON public.user_xp
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xp" ON public.user_xp
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own xp" ON public.user_xp
  FOR UPDATE USING (auth.uid() = user_id);

-- Add dedup_key to activities for duplicate prevention
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS dedup_key text DEFAULT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_dedup ON public.activities (user_id, dedup_key) WHERE dedup_key IS NOT NULL;

-- Function to award XP and recalculate level
CREATE OR REPLACE FUNCTION public.award_xp(
  _user_id uuid,
  _points integer,
  _check_daily_bonus boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _daily_bonus integer := 0;
  _total integer;
  _new_level integer;
  _result jsonb;
BEGIN
  -- Upsert user_xp row
  INSERT INTO public.user_xp (user_id, total_xp, level)
  VALUES (_user_id, 0, 1)
  ON CONFLICT (user_id) DO NOTHING;

  -- Check daily bonus
  IF _check_daily_bonus THEN
    UPDATE public.user_xp
    SET last_daily_bonus_date = CURRENT_DATE,
        total_xp = total_xp + 5
    WHERE user_id = _user_id
      AND (last_daily_bonus_date IS NULL OR last_daily_bonus_date < CURRENT_DATE);
    IF FOUND THEN
      _daily_bonus := 5;
    END IF;
  END IF;

  -- Add points
  UPDATE public.user_xp
  SET total_xp = total_xp + _points,
      level = GREATEST(1, FLOOR((total_xp + _points) / 100.0) + 1),
      updated_at = now()
  WHERE user_id = _user_id
  RETURNING total_xp, level INTO _total, _new_level;

  _result := jsonb_build_object(
    'total_xp', _total,
    'level', _new_level,
    'daily_bonus', _daily_bonus,
    'points_awarded', _points
  );

  RETURN _result;
END;
$$;
