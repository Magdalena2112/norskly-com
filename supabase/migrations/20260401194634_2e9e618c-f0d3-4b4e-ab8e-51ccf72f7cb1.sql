
-- Create a strict admin-only check that does NOT treat admin_teacher as admin
-- Used specifically for role management to prevent privilege escalation
CREATE OR REPLACE FUNCTION public.is_strict_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Update role management policies to use strict admin check
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_strict_admin(auth.uid()));

DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.is_strict_admin(auth.uid()));

DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.is_strict_admin(auth.uid()));
