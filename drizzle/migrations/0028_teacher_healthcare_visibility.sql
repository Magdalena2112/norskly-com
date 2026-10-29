CREATE TABLE public.teacher_course_approvals (
 teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
 language text NOT NULL,
 course_type text NOT NULL DEFAULT 'health',
 approved_by uuid NOT NULL DEFAULT auth.uid(),
 approved_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (teacher_id, language, course_type),
 CONSTRAINT healthcare_course_only CHECK (course_type = 'health')
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_course_approvals TO authenticated;
GRANT ALL ON public.teacher_course_approvals TO service_role;
ALTER TABLE public.teacher_course_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage course approvals" ON public.teacher_course_approvals FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Teachers read own course approvals" ON public.teacher_course_approvals FOR SELECT TO authenticated USING (teacher_id = public.current_teacher_id());
CREATE OR REPLACE FUNCTION public.get_course_teachers(p_language text, p_course text DEFAULT 'general')
RETURNS TABLE(id uuid, name text, bio text, photo_url text, spoken_languages text[], focus text[], rating numeric, students_count integer, is_verified boolean, healthcare_approved boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT t.id,t.name,t.bio,t.photo_url,t.spoken_languages,t.focus,t.rating,t.students_count,t.is_verified,
 EXISTS(SELECT 1 FROM public.teacher_course_approvals a WHERE a.teacher_id=t.id AND a.language=p_language AND a.course_type='health')
 FROM public.teachers t
 WHERE auth.uid() IS NOT NULL AND p_course IN ('general','health') AND t.is_active
 AND p_language = ANY(CASE WHEN cardinality(t.teaching_languages)>0 THEN t.teaching_languages ELSE ARRAY[t.language] END)
 AND EXISTS(SELECT 1 FROM public.lesson_types lt WHERE lt.teacher_id=t.id AND lt.language=p_language AND lt.is_active)
 AND (p_course='general' OR EXISTS(SELECT 1 FROM public.teacher_course_approvals a WHERE a.teacher_id=t.id AND a.language=p_language AND a.course_type='health'))
 ORDER BY t.rating DESC NULLS LAST,t.name;
$$;
REVOKE ALL ON FUNCTION public.get_course_teachers(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_course_teachers(text,text) TO authenticated, service_role;