DROP POLICY IF EXISTS "Admins can delete teachers" ON public.teachers;
CREATE POLICY "Strict admins can delete teachers"
ON public.teachers FOR DELETE TO authenticated
USING (public.is_strict_admin(auth.uid()));