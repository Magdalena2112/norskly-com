CREATE OR REPLACE FUNCTION public.approve_teacher_application(_application_id uuid, _notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  a public.teacher_applications%ROWTYPE;
  v_user_id uuid;
  v_teacher_id uuid;
  v_langs text[] := ARRAY[]::text[];
  v_l text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO a FROM public.teacher_applications WHERE id = _application_id;
  IF a.id IS NULL THEN RAISE EXCEPTION 'Application not found'; END IF;

  v_l := lower(a.languages);
  IF v_l ~ '(norv|norw|norsk|bokm)' THEN v_langs := array_append(v_langs, 'no'::text); END IF;
  IF v_l ~ '(engl)' THEN v_langs := array_append(v_langs, 'en'::text); END IF;
  IF v_l ~ '(nem|germ|deut)' THEN v_langs := array_append(v_langs, 'de'::text); END IF;
  IF array_length(v_langs,1) IS NULL THEN v_langs := ARRAY['no']::text[]; END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(a.email) AND email_confirmed_at IS NOT NULL LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    SELECT id INTO v_teacher_id FROM public.teachers WHERE user_id = v_user_id LIMIT 1;
  END IF;
  IF v_teacher_id IS NULL THEN
    SELECT id INTO v_teacher_id FROM public.teachers WHERE lower(email) = lower(a.email) LIMIT 1;
  END IF;

  IF v_teacher_id IS NULL THEN
    INSERT INTO public.teachers (name, bio, email, user_id, language, teaching_languages, spoken_languages, is_active, is_verified)
    VALUES (a.full_name, COALESCE(a.bio,''), lower(a.email), v_user_id, v_langs[1], v_langs, ARRAY[]::text[], true, true);
  ELSE
    UPDATE public.teachers SET is_active = true, is_verified = true,
      email = lower(a.email),
      user_id = COALESCE(v_user_id, user_id),
      teaching_languages = (SELECT array_agg(DISTINCT x) FROM unnest(array_cat(COALESCE(teaching_languages, ARRAY[]::text[]), v_langs)) x)
    WHERE id = v_teacher_id;
  END IF;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'teacher') ON CONFLICT (user_id, role) DO NOTHING;
    DELETE FROM public.user_roles WHERE user_id = v_user_id AND role = 'student';
  END IF;

  UPDATE public.teacher_applications
  SET status = 'approved', admin_notes = COALESCE(_notes, admin_notes),
      reviewed_at = now(), reviewed_by = auth.uid(), updated_at = now()
  WHERE id = _application_id;

  RETURN jsonb_build_object('role_granted', v_user_id IS NOT NULL, 'has_account', v_user_id IS NOT NULL,
    'email', lower(a.email), 'name', a.full_name);
END;
$function$;