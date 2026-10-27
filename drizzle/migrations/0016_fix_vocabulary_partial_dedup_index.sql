CREATE OR REPLACE FUNCTION public.complete_medical_vocabulary(_lesson_id uuid, _code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _lang text;
  _activity uuid;
  _reward jsonb;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT language INTO _lang FROM public.course_lessons
  WHERE id = _lesson_id AND lesson_code IN ('NO-HC-B1-L01', 'DE-HC-B1-L01');
  IF _lang IS NULL OR _code IS NULL OR _code !~ '^VO-(0[1-9]|1[0-9]|20)$' THEN
    RAISE EXCEPTION 'Invalid vocabulary exercise';
  END IF;
  INSERT INTO public.activities (user_id, module, type, points, payload, dedup_key, language)
  VALUES (_uid, 'vocabulary', 'lesson_vocabulary_exercise', 1,
    jsonb_build_object('lesson_id', _lesson_id, 'code', _code),
    'lesson-vocabulary:' || _lesson_id::text || ':' || _code, _lang)
  ON CONFLICT (user_id, dedup_key) WHERE dedup_key IS NOT NULL DO NOTHING RETURNING id INTO _activity;
  IF _activity IS NOT NULL THEN
    _reward := public.award_xp(_uid, 1, false, _lang);
  ELSE
    _reward := jsonb_build_object('points_awarded', 0);
  END IF;
  INSERT INTO public.course_lesson_progress (user_id, lesson_id, language, completed_steps, status)
  VALUES (_uid, _lesson_id, _lang, jsonb_build_array(_code), 'in_progress')
  ON CONFLICT (user_id, lesson_id) DO UPDATE SET
    completed_steps = (SELECT jsonb_agg(DISTINCT step) FROM jsonb_array_elements(
      COALESCE(course_lesson_progress.completed_steps, '[]'::jsonb) || EXCLUDED.completed_steps) AS steps(step));
  RETURN _reward;
END;
$$;
REVOKE ALL ON FUNCTION public.complete_medical_vocabulary(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_medical_vocabulary(uuid, text) TO authenticated;