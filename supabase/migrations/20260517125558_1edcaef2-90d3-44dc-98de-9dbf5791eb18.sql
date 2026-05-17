
-- 1. Tighten teacher_profile SELECT: only admins can read full row (incl. email, meet_link)
DROP POLICY IF EXISTS "Authenticated can view teacher profile" ON public.teacher_profile;

CREATE POLICY "Admins can view full teacher profile"
ON public.teacher_profile
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin_teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 2. Public-safe view for everyone (no email, no meet_link)
CREATE OR REPLACE VIEW public.teacher_profile_public
WITH (security_invoker = true)
AS
SELECT id, name, bio, focus, photo_url, rating, students_count, duration_minutes, updated_at
FROM public.teacher_profile;

GRANT SELECT ON public.teacher_profile_public TO anon, authenticated;

-- We need the view to bypass the new restrictive policy. Use a security-definer wrapper instead.
DROP VIEW IF EXISTS public.teacher_profile_public;

CREATE OR REPLACE FUNCTION public.get_teacher_profile_public()
RETURNS TABLE (
  id uuid,
  name text,
  bio text,
  focus text[],
  photo_url text,
  rating numeric,
  students_count integer,
  duration_minutes integer,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, bio, focus, photo_url, rating, students_count, duration_minutes, updated_at
  FROM public.teacher_profile
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_teacher_profile_public() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_teacher_profile_public() TO authenticated;

-- 3. Meet link only for users who actually booked a lesson
CREATE OR REPLACE FUNCTION public.get_teacher_meet_link()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE user_id = auth.uid())
     AND NOT has_role(auth.uid(), 'admin_teacher'::app_role)
     AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NULL;
  END IF;
  SELECT meet_link INTO v_link FROM public.teacher_profile LIMIT 1;
  RETURN v_link;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_teacher_meet_link() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_teacher_meet_link() TO authenticated;

-- 4. Add missing UPDATE policy on grammar_sessions
CREATE POLICY "Users can update own grammar sessions"
ON public.grammar_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Revoke public EXECUTE on internal-only SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_teacher_email() FROM PUBLIC, anon;
