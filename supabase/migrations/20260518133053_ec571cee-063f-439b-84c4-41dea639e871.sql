
-- Restrict the teachers table so emails and meeting links are no longer
-- readable by all authenticated users. Public listing is now served by
-- SECURITY DEFINER functions that expose only safe columns.

DROP POLICY IF EXISTS "Anyone can view active teachers" ON public.teachers;

CREATE POLICY "Teachers and admins can view full row"
ON public.teachers
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'admin_teacher'::app_role)
);

CREATE OR REPLACE FUNCTION public.get_active_teachers()
RETURNS TABLE (
  id uuid,
  name text,
  bio text,
  photo_url text,
  spoken_languages text[],
  focus text[],
  rating numeric,
  students_count integer,
  is_verified boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, bio, photo_url, spoken_languages, focus,
         rating, students_count, is_verified
  FROM public.teachers
  WHERE is_active = true
  ORDER BY rating DESC NULLS LAST;
$$;

CREATE OR REPLACE FUNCTION public.get_teacher_public_by_id(p_teacher_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  bio text,
  photo_url text,
  spoken_languages text[],
  focus text[],
  rating numeric,
  students_count integer,
  is_verified boolean,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, bio, photo_url, spoken_languages, focus,
         rating, students_count, is_verified, is_active
  FROM public.teachers
  WHERE id = p_teacher_id
    AND is_active = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_teachers() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_teacher_public_by_id(uuid) TO authenticated, anon;

-- Tighten the public CV upload policy so anonymous applicants can only write
-- under the dedicated applications/ prefix, and reject anything that is not a
-- standard CV document type.

DROP POLICY IF EXISTS teacher_cvs_public_upload ON storage.objects;

CREATE POLICY teacher_cvs_public_upload
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'teacher-cvs'
  AND (storage.foldername(name))[1] = 'applications'
  AND (
    lower(name) LIKE '%.pdf'
    OR lower(name) LIKE '%.doc'
    OR lower(name) LIKE '%.docx'
  )
);
