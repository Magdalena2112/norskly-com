ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS teaching_languages text[] NOT NULL DEFAULT '{}';
UPDATE public.teachers SET teaching_languages = ARRAY[language] WHERE teaching_languages = '{}' AND language IS NOT NULL;

CREATE OR REPLACE FUNCTION public.current_teacher_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.teachers WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.teacher_has_student(_teacher_id uuid, _student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.lessons WHERE teacher_id = _teacher_id AND user_id = _student_id);
$$;

CREATE TABLE public.teacher_lesson_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  language text NOT NULL DEFAULT 'no',
  covered text NOT NULL DEFAULT '',
  struggles text NOT NULL DEFAULT '',
  revisit text NOT NULL DEFAULT '',
  next_plan text NOT NULL DEFAULT '',
  shared_with_student boolean NOT NULL DEFAULT false,
  student_summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_lesson_notes TO authenticated;
GRANT ALL ON public.teacher_lesson_notes TO service_role;
ALTER TABLE public.teacher_lesson_notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.teacher_lesson_notes (teacher_id, student_id, created_at DESC);
CREATE TRIGGER trg_tln_updated_at BEFORE UPDATE ON public.teacher_lesson_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Teacher reads own notes" ON public.teacher_lesson_notes FOR SELECT TO authenticated
  USING (teacher_id = public.current_teacher_id());
CREATE POLICY "Teacher inserts notes for own students" ON public.teacher_lesson_notes FOR INSERT TO authenticated
  WITH CHECK (teacher_id = public.current_teacher_id() AND public.teacher_has_student(teacher_id, student_id));
CREATE POLICY "Teacher updates own notes" ON public.teacher_lesson_notes FOR UPDATE TO authenticated
  USING (teacher_id = public.current_teacher_id())
  WITH CHECK (teacher_id = public.current_teacher_id() AND public.teacher_has_student(teacher_id, student_id));
CREATE POLICY "Teacher deletes own notes" ON public.teacher_lesson_notes FOR DELETE TO authenticated
  USING (teacher_id = public.current_teacher_id());
CREATE POLICY "Student reads shared notes" ON public.teacher_lesson_notes FOR SELECT TO authenticated
  USING (student_id = auth.uid() AND shared_with_student = true);
CREATE POLICY "Admin reads all notes" ON public.teacher_lesson_notes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  language text NOT NULL DEFAULT 'no',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  resource_url text,
  due_date timestamptz,
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','submitted','reviewed')),
  submission_text text,
  submitted_at timestamptz,
  feedback text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_assignments TO authenticated;
GRANT ALL ON public.teacher_assignments TO service_role;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.teacher_assignments (teacher_id, student_id);
CREATE INDEX ON public.teacher_assignments (student_id, status);
CREATE TRIGGER trg_ta_updated_at BEFORE UPDATE ON public.teacher_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Teacher reads own assignments" ON public.teacher_assignments FOR SELECT TO authenticated
  USING (teacher_id = public.current_teacher_id());
CREATE POLICY "Teacher inserts assignments for own students" ON public.teacher_assignments FOR INSERT TO authenticated
  WITH CHECK (teacher_id = public.current_teacher_id() AND public.teacher_has_student(teacher_id, student_id));
CREATE POLICY "Teacher updates own assignments" ON public.teacher_assignments FOR UPDATE TO authenticated
  USING (teacher_id = public.current_teacher_id())
  WITH CHECK (teacher_id = public.current_teacher_id());
CREATE POLICY "Teacher deletes own assignments" ON public.teacher_assignments FOR DELETE TO authenticated
  USING (teacher_id = public.current_teacher_id());
CREATE POLICY "Student reads own assignments" ON public.teacher_assignments FOR SELECT TO authenticated
  USING (student_id = auth.uid());
CREATE POLICY "Student submits own assignments" ON public.teacher_assignments FOR UPDATE TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "Admin reads all assignments" ON public.teacher_assignments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Students may only change submission fields
CREATE OR REPLACE FUNCTION public.enforce_assignment_student_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.teacher_id = public.current_teacher_id() THEN
    IF NEW.status = 'reviewed' AND OLD.status <> 'reviewed' THEN NEW.reviewed_at := now(); END IF;
    RETURN NEW;
  END IF;
  IF OLD.student_id = auth.uid() THEN
    IF NEW.teacher_id IS DISTINCT FROM OLD.teacher_id OR NEW.student_id IS DISTINCT FROM OLD.student_id
       OR NEW.title IS DISTINCT FROM OLD.title OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.resource_url IS DISTINCT FROM OLD.resource_url OR NEW.due_date IS DISTINCT FROM OLD.due_date
       OR NEW.feedback IS DISTINCT FROM OLD.feedback OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
       OR NEW.language IS DISTINCT FROM OLD.language THEN
      RAISE EXCEPTION 'Not allowed';
    END IF;
    IF OLD.status = 'reviewed' THEN RAISE EXCEPTION 'Zadatak je već pregledan'; END IF;
    NEW.status := 'submitted';
    NEW.submitted_at := now();
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Not allowed';
END;
$$;
CREATE TRIGGER trg_ta_enforce BEFORE UPDATE ON public.teacher_assignments FOR EACH ROW EXECUTE FUNCTION public.enforce_assignment_student_update();

-- Teacher's student roster (names visible even without analytics consent)
CREATE OR REPLACE FUNCTION public.get_my_students()
RETURNS TABLE(student_id uuid, display_name text, languages text[], lessons_count bigint, next_lesson timestamptz, last_lesson timestamptz, consent_granted boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.user_id,
         COALESCE(NULLIF(p.display_name,''), 'Učenik'),
         array_agg(DISTINCT l.language),
         count(*),
         min(l.start_time) FILTER (WHERE l.start_time >= now() AND l.status = 'scheduled'),
         max(l.start_time) FILTER (WHERE l.start_time < now()),
         COALESCE(bool_or(c.consent_granted), false)
  FROM public.lessons l
  LEFT JOIN public.profiles p ON p.user_id = l.user_id
  LEFT JOIN public.student_teacher_consents c ON c.student_id = l.user_id AND c.teacher_id = l.teacher_id
  WHERE l.teacher_id = public.current_teacher_id()
  GROUP BY l.user_id, p.display_name;
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_students() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_students() TO authenticated;

-- Approve: create teacher profile + grant 'teacher' (never admin) role
CREATE OR REPLACE FUNCTION public.approve_teacher_application(_application_id uuid, _notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a public.teacher_applications%ROWTYPE;
  v_user_id uuid;
  v_langs text[] := '{}';
  v_l text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT * INTO a FROM public.teacher_applications WHERE id = _application_id;
  IF a.id IS NULL THEN RAISE EXCEPTION 'Application not found'; END IF;

  v_l := lower(a.languages);
  IF v_l ~ '(norv|norw|norsk|bokm)' THEN v_langs := v_langs || 'no'; END IF;
  IF v_l ~ '(engl)' THEN v_langs := v_langs || 'en'; END IF;
  IF v_l ~ '(nem|germ|deut)' THEN v_langs := v_langs || 'de'; END IF;
  IF array_length(v_langs,1) IS NULL THEN v_langs := ARRAY['no']; END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(a.email) AND email_confirmed_at IS NOT NULL LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM public.teachers WHERE lower(email) = lower(a.email)) THEN
    INSERT INTO public.teachers (name, bio, email, user_id, language, teaching_languages, spoken_languages, is_active, is_verified)
    VALUES (a.full_name, COALESCE(a.bio,''), lower(a.email), v_user_id, v_langs[1], v_langs, '{}', true, true);
  ELSE
    UPDATE public.teachers SET is_active = true, is_verified = true,
      user_id = COALESCE(user_id, v_user_id), teaching_languages = v_langs
    WHERE lower(email) = lower(a.email);
  END IF;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'teacher')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  UPDATE public.teacher_applications
  SET status = 'approved', admin_notes = COALESCE(_notes, admin_notes),
      reviewed_at = now(), reviewed_by = auth.uid(), updated_at = now()
  WHERE id = _application_id;

  RETURN jsonb_build_object('role_granted', v_user_id IS NOT NULL, 'has_account', v_user_id IS NOT NULL,
    'email', lower(a.email), 'name', a.full_name);
END;
$$;

-- Called by the signed-in user after activation; only verified emails can claim
CREATE OR REPLACE FUNCTION public.claim_teacher_account()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_email text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT lower(email) INTO v_email FROM auth.users WHERE id = auth.uid() AND email_confirmed_at IS NOT NULL;
  IF v_email IS NULL THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.teacher_applications WHERE lower(email) = v_email AND status = 'approved') THEN
    RETURN false;
  END IF;
  UPDATE public.teachers SET user_id = auth.uid() WHERE lower(email) = v_email AND (user_id IS NULL OR user_id = auth.uid());
  IF NOT EXISTS (SELECT 1 FROM public.teachers WHERE user_id = auth.uid()) THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'teacher') ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.claim_teacher_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_teacher_account() TO authenticated;

-- Teachers may update status of their own lessons (e.g. mark completed)
CREATE POLICY "Teacher can update own lessons" ON public.lessons FOR UPDATE TO authenticated
  USING (teacher_id = public.current_teacher_id()) WITH CHECK (teacher_id = public.current_teacher_id());
CREATE OR REPLACE FUNCTION public.enforce_lesson_update_restrictions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'admin_teacher') THEN
    RETURN NEW;
  END IF;
  IF OLD.teacher_id IS NOT NULL AND OLD.teacher_id = public.current_teacher_id() THEN
    IF NEW.start_time IS DISTINCT FROM OLD.start_time OR NEW.end_time IS DISTINCT FROM OLD.end_time
       OR NEW.slot_id IS DISTINCT FROM OLD.slot_id OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.teacher_id IS DISTINCT FROM OLD.teacher_id OR NEW.student_note IS DISTINCT FROM OLD.student_note THEN
      RAISE EXCEPTION 'Teachers can only update lesson status';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.user_id = auth.uid() AND OLD.status = 'scheduled' AND NEW.status = 'cancelled'
     AND NEW.start_time = OLD.start_time AND NEW.end_time = OLD.end_time
     AND NEW.slot_id = OLD.slot_id AND NEW.user_id = OLD.user_id THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status OR NEW.start_time IS DISTINCT FROM OLD.start_time
     OR NEW.end_time IS DISTINCT FROM OLD.end_time OR NEW.slot_id IS DISTINCT FROM OLD.slot_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'You can only update the note on your lesson';
  END IF;
  RETURN NEW;
END;
$$;