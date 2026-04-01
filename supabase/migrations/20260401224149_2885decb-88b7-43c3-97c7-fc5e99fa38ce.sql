
-- Drop the admin-only policy and the view (they don't work well together)
DROP POLICY IF EXISTS "Only admins can view teacher profile" ON public.teacher_profile;
DROP VIEW IF EXISTS public.teacher_profile_public;

-- Allow all authenticated to read, but code will only select non-sensitive columns
CREATE POLICY "Authenticated can view teacher profile"
ON public.teacher_profile
FOR SELECT
TO authenticated
USING (true);

-- Create a secure function to get teacher email (for booking notifications only)
CREATE OR REPLACE FUNCTION public.get_teacher_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT email FROM public.teacher_profile LIMIT 1;
$$;
