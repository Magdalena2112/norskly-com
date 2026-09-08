-- 1) award_xp: owner check + point clamp + explicit grants
CREATE OR REPLACE FUNCTION public.award_xp(_user_id uuid, _points integer, _check_daily_bonus boolean DEFAULT false, _language text DEFAULT 'no'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _daily_bonus integer := 0;
  _total integer;
  _new_level integer;
  _pts integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  _pts := LEAST(GREATEST(COALESCE(_points, 0), 0), 50);

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
  SET total_xp = total_xp + _pts,
      level = GREATEST(1, FLOOR((total_xp + _pts) / 100.0) + 1),
      updated_at = now()
  WHERE user_id = _user_id
    AND language = _language
  RETURNING total_xp, level INTO _total, _new_level;

  RETURN jsonb_build_object(
    'total_xp', _total,
    'level', _new_level,
    'daily_bonus', _daily_bonus,
    'points_awarded', _pts
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_xp(uuid, integer, boolean, text) TO authenticated;

-- 2) availability_slots: restrict SELECT
DROP POLICY IF EXISTS "Authenticated can view slots" ON public.availability_slots;

CREATE POLICY "Users can view relevant slots"
ON public.availability_slots
FOR SELECT
TO authenticated
USING (
  status = 'open'
  OR EXISTS (
    SELECT 1 FROM public.lessons l
    WHERE l.slot_id = availability_slots.id AND l.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.teachers t
    WHERE t.id = availability_slots.teacher_id AND t.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'admin_teacher'::app_role)
);

-- 3) Safe teacher browsing by language (no email / meet_link)
CREATE OR REPLACE FUNCTION public.get_active_teachers_by_language(p_language text)
RETURNS TABLE(id uuid, name text, bio text, photo_url text, spoken_languages text[], focus text[], rating numeric, students_count integer, is_verified boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id, name, bio, photo_url, spoken_languages, focus,
         rating, students_count, is_verified
  FROM public.teachers
  WHERE is_active = true
    AND language = p_language
  ORDER BY rating DESC NULLS LAST;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_active_teachers_by_language(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_teachers_by_language(text) TO anon, authenticated;