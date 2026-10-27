CREATE TABLE public.course_enrollment_recoveries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid NOT NULL UNIQUE REFERENCES public.language_profiles(id), user_id uuid NOT NULL, language text NOT NULL, previous_course text NOT NULL, selected_course text NOT NULL CHECK(selected_course IN ('general','health')), previous_level text, selected_level text, reviewed_by uuid NOT NULL, reviewed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.course_enrollment_recoveries TO authenticated;
GRANT ALL ON public.course_enrollment_recoveries TO service_role;
ALTER TABLE public.course_enrollment_recoveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict admins read recovery audit" ON public.course_enrollment_recoveries FOR SELECT TO authenticated USING(public.is_strict_admin(auth.uid()));
CREATE FUNCTION public.legacy_course_recovery_candidates() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_strict_admin(auth.uid()) THEN RAISE EXCEPTION 'Samo administrator može pregledati ranije upise.'; END IF;
 RETURN COALESCE((SELECT jsonb_agg(row_to_json(c)) FROM (
 SELECT lp.id profile_id, lp.user_id, lp.language, lp.level, COALESCE(NULLIF(pr.display_name,''),'Učenik') display_name,
 (SELECT count(*) FROM public.course_lesson_progress p JOIN public.course_lessons l ON l.id=p.lesson_id WHERE p.user_id=lp.user_id AND p.language=lp.language AND l.language=lp.language AND l.course='health' AND p.created_at<to_timestamp(1793103214144/1000.0)) health_lessons,
 (SELECT count(*) FROM public.course_lesson_progress p JOIN public.course_lessons l ON l.id=p.lesson_id WHERE p.user_id=lp.user_id AND p.language=lp.language AND l.language=lp.language AND l.course='general') general_lessons,
 (SELECT COALESCE(jsonb_agg(jsonb_build_object('lesson',l.lesson_code,'course',l.course,'steps',p.completed_steps,'status',p.status)),'[]'::jsonb) FROM public.course_lesson_progress p JOIN public.course_lessons l ON l.id=p.lesson_id WHERE p.user_id=lp.user_id AND p.language=lp.language AND l.language=lp.language) progress
 FROM public.language_profiles lp LEFT JOIN public.profiles pr ON pr.user_id=lp.user_id
 WHERE lp.course_type='general' AND lp.onboarding_completed AND lp.language IN ('no','de') AND lp.created_at<to_timestamp(1793103214144/1000.0)
 AND NOT EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=lp.user_id AND r.role IN ('admin','admin_teacher','teacher'))
 AND NOT EXISTS(SELECT 1 FROM public.course_enrollment_recoveries a WHERE a.profile_id=lp.id)
 AND EXISTS(SELECT 1 FROM public.course_lesson_progress p JOIN public.course_lessons l ON l.id=p.lesson_id WHERE p.user_id=lp.user_id AND p.language=lp.language AND l.language=lp.language AND l.course='health' AND p.created_at<to_timestamp(1793103214144/1000.0))
 ORDER BY lp.language,lp.created_at
 ) c),'[]'::jsonb);
END; $$;
REVOKE ALL ON FUNCTION public.legacy_course_recovery_candidates() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.legacy_course_recovery_candidates() TO authenticated;
CREATE FUNCTION public.resolve_legacy_course_enrollment(p_profile_id uuid,p_course text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE lp public.language_profiles%ROWTYPE; previous public.course_enrollment_recoveries%ROWTYPE; audit_id uuid; new_level text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_strict_admin(auth.uid()) THEN RAISE EXCEPTION 'Samo administrator može potvrditi upis.'; END IF;
 IF p_course IS NULL OR p_course NOT IN ('general','health') THEN RAISE EXCEPTION 'Izaberi kurs.'; END IF;
 SELECT * INTO lp FROM public.language_profiles WHERE id=p_profile_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Upis ne postoji.'; END IF;
 SELECT * INTO previous FROM public.course_enrollment_recoveries WHERE profile_id=p_profile_id;
 IF FOUND THEN
 IF previous.selected_course<>p_course THEN RAISE EXCEPTION 'Upis je već potvrđen za drugi kurs.'; END IF;
 RETURN jsonb_build_object('id',previous.id,'already_resolved',true);
 END IF;
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.legacy_course_recovery_candidates()) c WHERE c->>'profile_id'=p_profile_id::text) THEN RAISE EXCEPTION 'Ovaj profil nije raniji zdravstveni upis za oporavak.'; END IF;
 new_level := CASE WHEN p_course='health' THEN 'B1' ELSE lp.level END;
 INSERT INTO public.course_enrollment_recoveries(profile_id,user_id,language,previous_course,selected_course,previous_level,selected_level,reviewed_by) VALUES(lp.id,lp.user_id,lp.language,lp.course_type,p_course,lp.level,new_level) RETURNING id INTO audit_id;
 UPDATE public.language_profiles SET course_type=p_course,level=new_level WHERE id=lp.id;
 RETURN jsonb_build_object('id',audit_id,'already_resolved',false);
END; $$;
REVOKE ALL ON FUNCTION public.resolve_legacy_course_enrollment(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.resolve_legacy_course_enrollment(uuid,text) TO authenticated;