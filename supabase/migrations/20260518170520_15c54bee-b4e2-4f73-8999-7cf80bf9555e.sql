-- 1) Add language column to user_xp
ALTER TABLE public.user_xp
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'no';

-- 2) Drop old unique on user_id (if it exists as a unique constraint or index)
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.user_xp'::regclass
      AND contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE public.user_xp DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

-- Also drop any old unique indexes on user_id alone
DROP INDEX IF EXISTS public.user_xp_user_id_key;
DROP INDEX IF EXISTS public.user_xp_user_id_idx;

-- 3) Add composite unique (user_id, language)
ALTER TABLE public.user_xp
  ADD CONSTRAINT user_xp_user_language_key UNIQUE (user_id, language);

-- 4) Replace award_xp with language-aware version
DROP FUNCTION IF EXISTS public.award_xp(uuid, integer, boolean);
DROP FUNCTION IF EXISTS public.award_xp(uuid, integer, boolean, text);

CREATE OR REPLACE FUNCTION public.award_xp(
  _user_id uuid,
  _points integer,
  _check_daily_bonus boolean DEFAULT false,
  _language text DEFAULT 'no'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _daily_bonus integer := 0;
  _total integer;
  _new_level integer;
BEGIN
  INSERT INTO public.user_xp (user_id, language, total_xp, level)
  VALUES (_user_id, _language, 0, 1)
  ON CONFLICT (user_id, language) DO NOTHING;

  IF _check_daily_bonus THEN
    UPDATE public.user_xp
    SET last_daily_bonus_date = CURRENT_DATE,
        total_xp = total_xp + 5
    WHERE user_id = _user_id
      AND language = _language
      AND (last_daily_bonus_date IS NULL OR last_daily_bonus_date < CURRENT_DATE);
    IF FOUND THEN
      _daily_bonus := 5;
    END IF;
  END IF;

  UPDATE public.user_xp
  SET total_xp = total_xp + _points,
      level = GREATEST(1, FLOOR((total_xp + _points) / 100.0) + 1),
      updated_at = now()
  WHERE user_id = _user_id
    AND language = _language
  RETURNING total_xp, level INTO _total, _new_level;

  RETURN jsonb_build_object(
    'total_xp', _total,
    'level', _new_level,
    'daily_bonus', _daily_bonus,
    'points_awarded', _points
  );
END;
$function$;