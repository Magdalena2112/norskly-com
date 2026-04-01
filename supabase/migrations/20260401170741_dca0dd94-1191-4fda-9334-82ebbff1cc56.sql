
-- 1. Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text DEFAULT '',
  level text DEFAULT 'A1',
  learning_goal text DEFAULT '',
  focus_area text DEFAULT '',
  confidence_level integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all profiles" ON public.profiles FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin_teacher'::app_role));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- 2. Update has_role to support admin_teacher <-> admin interchangeability
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
      AND (
        role = _role
        OR (_role = 'admin_teacher' AND role = 'admin')
        OR (_role = 'admin' AND role = 'admin_teacher')
      )
  )
$$;

-- 3. Admin-readable SELECT policies for student data tables
CREATE POLICY "Admin can view all activities" ON public.activities FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin_teacher'::app_role));

CREATE POLICY "Admin can view all error_events" ON public.error_events FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin_teacher'::app_role));

CREATE POLICY "Admin can view all grammar_sessions" ON public.grammar_sessions FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin_teacher'::app_role));

CREATE POLICY "Admin can view all vocab_items" ON public.vocab_items FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin_teacher'::app_role));

CREATE POLICY "Admin can view all vocabulary_words" ON public.vocabulary_words FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin_teacher'::app_role));

CREATE POLICY "Admin can view all talk_sessions" ON public.talk_sessions FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin_teacher'::app_role));

CREATE POLICY "Admin can view all user_xp" ON public.user_xp FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin_teacher'::app_role));

CREATE POLICY "Admin can view all grammar_submissions" ON public.grammar_submissions FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin_teacher'::app_role));

-- 4. Auto-assign student role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- 5. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- 6. Update lesson trigger for admin_teacher
CREATE OR REPLACE FUNCTION public.enforce_lesson_update_restrictions()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'admin_teacher') THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.start_time IS DISTINCT FROM OLD.start_time
     OR NEW.end_time IS DISTINCT FROM OLD.end_time
     OR NEW.slot_id IS DISTINCT FROM OLD.slot_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
  THEN
    RAISE EXCEPTION 'You can only update the note on your lesson';
  END IF;

  RETURN NEW;
END;
$$;

-- 7. Additional admin_teacher policies for teacher_profile
CREATE POLICY "Admin teacher can update teacher profile" ON public.teacher_profile
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin_teacher'::app_role));

-- 8. Additional admin_teacher policies for availability_slots
CREATE POLICY "Admin teacher can insert slots" ON public.availability_slots
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin_teacher'::app_role));

CREATE POLICY "Admin teacher can update slots" ON public.availability_slots
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin_teacher'::app_role));

CREATE POLICY "Admin teacher can delete slots" ON public.availability_slots
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin_teacher'::app_role));

-- 9. Additional admin_teacher policies for lessons
CREATE POLICY "Admin teacher can update all lessons" ON public.lessons
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin_teacher'::app_role));

CREATE POLICY "Admin teacher can view all lessons" ON public.lessons
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin_teacher'::app_role));

-- 10. Admin can view all roles
CREATE POLICY "Admin can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin_teacher'::app_role));

-- 11. Timestamp trigger for profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
