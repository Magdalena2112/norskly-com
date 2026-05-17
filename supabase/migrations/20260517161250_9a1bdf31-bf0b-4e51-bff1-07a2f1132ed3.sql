
ALTER TABLE public.teacher_applications
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

-- Ensure status uses controlled vocabulary
ALTER TABLE public.teacher_applications
  DROP CONSTRAINT IF EXISTS teacher_applications_status_check;
ALTER TABLE public.teacher_applications
  ADD CONSTRAINT teacher_applications_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- Allow admins to read teacher CVs from the private bucket
DROP POLICY IF EXISTS "Admins can read teacher cvs" ON storage.objects;
CREATE POLICY "Admins can read teacher cvs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'teacher-cvs'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_teacher'::app_role))
);

-- Admin RPC: approve a teacher application atomically.
-- If a user with the application email exists in auth.users, grant admin_teacher role.
CREATE OR REPLACE FUNCTION public.approve_teacher_application(_application_id uuid, _notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_user_id uuid;
  v_role_granted boolean := false;
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_teacher'::app_role)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT email INTO v_email FROM public.teacher_applications WHERE id = _application_id;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(v_email) LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin_teacher')
    ON CONFLICT (user_id, role) DO NOTHING;
    v_role_granted := true;
  END IF;

  UPDATE public.teacher_applications
  SET status = 'approved',
      admin_notes = COALESCE(_notes, admin_notes),
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      updated_at = now()
  WHERE id = _application_id;

  RETURN jsonb_build_object('role_granted', v_role_granted, 'matched_user_id', v_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_teacher_application(_application_id uuid, _notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_teacher'::app_role)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.teacher_applications
  SET status = 'rejected',
      admin_notes = COALESCE(_notes, admin_notes),
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      updated_at = now()
  WHERE id = _application_id;
END;
$$;
