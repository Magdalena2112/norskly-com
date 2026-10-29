ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS teaching_levels text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS course_types text[] NOT NULL DEFAULT '{general}';
ALTER TABLE public.teachers ADD CONSTRAINT teachers_teaching_levels_check CHECK (teaching_levels <@ ARRAY['A1','A2','B1','B2','C1']::text[]);
ALTER TABLE public.teachers ADD CONSTRAINT teachers_course_types_check CHECK (course_types <@ ARRAY['general','health']::text[]);
DROP FUNCTION IF EXISTS public.get_course_teachers(text,text);
CREATE FUNCTION public.get_course_teachers(p_language text, p_course text DEFAULT 'general')
RETURNS TABLE(id uuid, name text, bio text, photo_url text, spoken_languages text[], focus text[], rating numeric, students_count integer, is_verified boolean, healthcare_approved boolean, teaching_levels text[], course_types text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT t.id,t.name,t.bio,t.photo_url,t.spoken_languages,t.focus,t.rating,t.students_count,t.is_verified,
 EXISTS(SELECT 1 FROM public.teacher_course_approvals a WHERE a.teacher_id=t.id AND a.language=p_language AND a.course_type='health'),
 t.teaching_levels, t.course_types
 FROM public.teachers t
 WHERE auth.uid() IS NOT NULL AND p_course IN ('general','health') AND t.is_active
 AND p_language = ANY(CASE WHEN cardinality(t.teaching_languages)>0 THEN t.teaching_languages ELSE ARRAY[t.language] END)
 AND EXISTS(SELECT 1 FROM public.lesson_types lt WHERE lt.teacher_id=t.id AND lt.language=p_language AND lt.is_active)
 AND (p_course='general' OR EXISTS(SELECT 1 FROM public.teacher_course_approvals a WHERE a.teacher_id=t.id AND a.language=p_language AND a.course_type='health'))
 ORDER BY t.rating DESC NULLS LAST,t.name;
$$;
REVOKE ALL ON FUNCTION public.get_course_teachers(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_course_teachers(text,text) TO authenticated, service_role;