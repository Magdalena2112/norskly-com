
-- Step 1: Create app_role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Step 2: Create has_role() security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
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
      AND role = _role
  )
$$;

-- Step 3: Assign admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('6393ea42-d1c5-45e3-b3de-be47932a6d9b', 'admin');

-- Step 4: Fix teacher_profile UPDATE policy
DROP POLICY IF EXISTS "Authenticated can update teacher profile" ON public.teacher_profile;
CREATE POLICY "Admins can update teacher profile"
ON public.teacher_profile FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Step 5: Fix availability_slots policies
DROP POLICY IF EXISTS "Authenticated can insert slots" ON public.availability_slots;
DROP POLICY IF EXISTS "Authenticated can update slots" ON public.availability_slots;
DROP POLICY IF EXISTS "Authenticated can delete slots" ON public.availability_slots;

CREATE POLICY "Admins can insert slots"
ON public.availability_slots FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update slots"
ON public.availability_slots FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete slots"
ON public.availability_slots FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Step 6: Fix lessons policies
DROP POLICY IF EXISTS "Authenticated can view lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admin can update all lessons" ON public.lessons;

CREATE POLICY "Users can view own lessons or admin all"
ON public.lessons FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all lessons"
ON public.lessons FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Step 7: Add UPDATE policy for vocabulary_words
CREATE POLICY "Users can update own vocabulary_words"
ON public.vocabulary_words FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
