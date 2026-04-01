
-- 1. Fix teacher_profile: replace permissive SELECT for everyone with two policies
DROP POLICY IF EXISTS "Anyone can view teacher profile" ON public.teacher_profile;

-- Public fields only for regular authenticated users
CREATE POLICY "Authenticated can view public teacher info"
ON public.teacher_profile
FOR SELECT
TO authenticated
USING (true);

-- Create a security definer view/function approach won't work easily,
-- so instead we remove email and meet_link from being exposed by
-- creating a restricted policy approach using column-level security via a view.

-- Actually, RLS is row-level not column-level. Best approach: move sensitive fields 
-- or use a view. Let's create a secure view for public access and restrict the table.

-- Drop the policy we just created and do it properly:
DROP POLICY IF EXISTS "Authenticated can view public teacher info" ON public.teacher_profile;

-- Only admin/teacher can SELECT the raw table
CREATE POLICY "Only admins can view teacher profile"
ON public.teacher_profile
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_teacher'::app_role)
);

-- Create a secure view for students (no email, no meet_link)
CREATE OR REPLACE VIEW public.teacher_profile_public AS
SELECT id, name, bio, focus, photo_url, rating, students_count, duration_minutes, updated_at
FROM public.teacher_profile;

-- Grant access to the view
GRANT SELECT ON public.teacher_profile_public TO authenticated;

-- 2. Fix availability_slots: tighten student booking policy
DROP POLICY IF EXISTS "Students can book open slots" ON public.availability_slots;

CREATE POLICY "Students can book open slots"
ON public.availability_slots
FOR UPDATE
TO authenticated
USING (status = 'open')
WITH CHECK (
  status = 'booked'
  AND EXISTS (
    SELECT 1 FROM public.lessons
    WHERE lessons.slot_id = availability_slots.id
      AND lessons.user_id = auth.uid()
  )
);

-- 3. Fix function search_path on 4 email queue functions
CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
 RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;
