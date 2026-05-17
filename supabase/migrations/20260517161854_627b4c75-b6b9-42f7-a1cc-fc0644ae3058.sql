
-- 1) Replace permissive INSERT policy on teacher_applications with real validation
DROP POLICY IF EXISTS "Anyone can submit teacher application" ON public.teacher_applications;
CREATE POLICY "Anyone can submit teacher application"
ON public.teacher_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND char_length(full_name) BETWEEN 2 AND 120
  AND char_length(email) BETWEEN 3 AND 255
  AND email LIKE '%@%.%'
  AND char_length(languages) BETWEEN 2 AND 200
  AND char_length(bio) BETWEEN 20 AND 2000
  AND reviewed_at IS NULL
  AND reviewed_by IS NULL
  AND admin_notes IS NULL
);

-- 2) Storage: drop broad listing policy on the public teacher-photos bucket.
-- Files remain readable via their public URLs (bucket is public).
DROP POLICY IF EXISTS "Anyone can view teacher photos" ON storage.objects;

-- 3) Lock down SECURITY DEFINER function execution.
-- Default revoke from public, then grant only to the roles that need it.

-- RLS helpers — must be callable by signed-in users (used inside RLS expressions)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_strict_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_strict_admin(uuid) TO authenticated, service_role;

-- Client RPCs callable by signed-in users
REVOKE EXECUTE ON FUNCTION public.book_lesson(uuid, timestamptz, timestamptz, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.book_lesson(uuid, timestamptz, timestamptz, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_teacher_meet_link() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_teacher_meet_link() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_teacher_profile_public() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_teacher_profile_public() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.approve_teacher_application(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_teacher_application(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.reject_teacher_application(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_teacher_application(uuid, text) TO authenticated;

-- Service-role-only helpers (edge functions / cron)
REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp(uuid, integer, boolean) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_teacher_email() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_teacher_email() TO service_role;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

-- Trigger functions — should never be called via API
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_talk_session_points() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_activity_points() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_grammar_session_score() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_lesson_insert_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_lesson_update_restrictions() FROM PUBLIC, anon, authenticated;
