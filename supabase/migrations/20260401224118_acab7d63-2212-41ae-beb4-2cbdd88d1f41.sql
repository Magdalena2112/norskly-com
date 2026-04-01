
DROP VIEW IF EXISTS public.teacher_profile_public;

CREATE VIEW public.teacher_profile_public
WITH (security_invoker = true)
AS
SELECT id, name, bio, focus, photo_url, rating, students_count, duration_minutes, updated_at
FROM public.teacher_profile;

GRANT SELECT ON public.teacher_profile_public TO authenticated;
