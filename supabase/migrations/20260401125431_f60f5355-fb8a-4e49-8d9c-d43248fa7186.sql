
-- 1. Lock down user_roles: only admins can INSERT/UPDATE/DELETE
CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Fix teacher-photos storage: restrict write to admins
DROP POLICY IF EXISTS "Authenticated can upload teacher photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update teacher photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete teacher photos" ON storage.objects;

CREATE POLICY "Admins can upload teacher photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'teacher-photos'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update teacher photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'teacher-photos'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete teacher photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'teacher-photos'
  AND public.has_role(auth.uid(), 'admin')
);

-- 3. Prevent XP/points manipulation with triggers

-- 3a. Force points=0 on activities INSERT (real points awarded via award_xp RPC)
CREATE OR REPLACE FUNCTION public.enforce_activity_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.points := 0;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_activity_points_trigger
BEFORE INSERT ON public.activities
FOR EACH ROW
EXECUTE FUNCTION public.enforce_activity_points();

-- 3b. Prevent direct user_xp manipulation: remove client INSERT/UPDATE policies
DROP POLICY IF EXISTS "Users can insert own xp" ON public.user_xp;
DROP POLICY IF EXISTS "Users can update own xp" ON public.user_xp;

-- 3c. Force points=0 on talk_sessions INSERT/UPDATE from client
CREATE OR REPLACE FUNCTION public.enforce_talk_session_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.points := 0;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_talk_session_points_trigger
BEFORE INSERT OR UPDATE ON public.talk_sessions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_talk_session_points();
