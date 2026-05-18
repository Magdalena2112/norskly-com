
-- =========================================================
-- 1. TEACHERS TABLE
-- =========================================================
CREATE TABLE public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  name text NOT NULL,
  bio text NOT NULL DEFAULT '',
  photo_url text,
  spoken_languages text[] NOT NULL DEFAULT ARRAY['Norveški','Engleski','Srpski'],
  focus text[] NOT NULL DEFAULT ARRAY[]::text[],
  rating numeric NOT NULL DEFAULT 4.9,
  students_count integer NOT NULL DEFAULT 0,
  meet_link text,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active teachers"
  ON public.teachers FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Teacher can update own profile"
  ON public.teachers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_teacher'::app_role));

CREATE POLICY "Admins can insert teachers"
  ON public.teachers FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_teacher'::app_role));

CREATE POLICY "Admins can delete teachers"
  ON public.teachers FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 2. LESSON TYPES
-- =========================================================
CREATE TYPE public.lesson_kind AS ENUM ('individual','group','course');

CREATE TABLE public.lesson_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  kind public.lesson_kind NOT NULL DEFAULT 'individual',
  duration_minutes integer NOT NULL DEFAULT 60,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NOK',
  capacity integer NOT NULL DEFAULT 1,
  language text NOT NULL DEFAULT 'no',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active lesson types"
  ON public.lesson_types FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Teacher manages own lesson types"
  ON public.lesson_types FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = lesson_types.teacher_id AND t.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'admin_teacher'::app_role)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = lesson_types.teacher_id AND t.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'admin_teacher'::app_role)
  );

CREATE TRIGGER trg_lesson_types_updated_at
  BEFORE UPDATE ON public.lesson_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 3. CONSENTS
-- =========================================================
CREATE TABLE public.student_teacher_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  consent_granted boolean NOT NULL DEFAULT false,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, teacher_id)
);

ALTER TABLE public.student_teacher_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student manages own consents"
  ON public.student_teacher_consents FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teacher can view own consents"
  ON public.student_teacher_consents FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = student_teacher_consents.teacher_id AND t.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'admin_teacher'::app_role)
  );

CREATE TRIGGER trg_consents_updated_at
  BEFORE UPDATE ON public.student_teacher_consents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 4. ALTER availability_slots + lessons
-- =========================================================
ALTER TABLE public.availability_slots
  ADD COLUMN teacher_id uuid REFERENCES public.teachers(id) ON DELETE CASCADE;

ALTER TABLE public.lessons
  ADD COLUMN teacher_id uuid REFERENCES public.teachers(id),
  ADD COLUMN lesson_type_id uuid REFERENCES public.lesson_types(id),
  ADD COLUMN share_analytics boolean NOT NULL DEFAULT false;

-- =========================================================
-- 5. SEED: teacher from teacher_profile + 3 lesson types
-- =========================================================
DO $$
DECLARE
  v_tp RECORD;
  v_teacher_id uuid;
  v_admin_user uuid;
BEGIN
  SELECT * INTO v_tp FROM public.teacher_profile LIMIT 1;
  SELECT id INTO v_admin_user FROM auth.users WHERE lower(email) = 'magdalenaradojevic75@gmail.com' LIMIT 1;

  IF v_tp.id IS NOT NULL THEN
    INSERT INTO public.teachers (user_id, name, bio, photo_url, focus, rating, students_count, meet_link, email, is_active, is_verified)
    VALUES (v_admin_user, v_tp.name, COALESCE(v_tp.bio,''), v_tp.photo_url, COALESCE(v_tp.focus, ARRAY[]::text[]), v_tp.rating, v_tp.students_count, v_tp.meet_link, v_tp.email, true, true)
    RETURNING id INTO v_teacher_id;

    -- Backfill existing slots/lessons
    UPDATE public.availability_slots SET teacher_id = v_teacher_id WHERE teacher_id IS NULL;
    UPDATE public.lessons SET teacher_id = v_teacher_id WHERE teacher_id IS NULL;

    -- Seed lesson types
    INSERT INTO public.lesson_types (teacher_id, title, description, kind, duration_minutes, price_cents, capacity)
    VALUES
      (v_teacher_id, 'Individualni čas', 'Personalizovani čas jedan-na-jedan, prilagođen tvom nivou i ciljevima.', 'individual', 90, 75000, 1),
      (v_teacher_id, 'Grupni čas', 'Mala grupa do 4 polaznika, dinamična konverzacija i vežbe.', 'group', 60, 35000, 4),
      (v_teacher_id, 'Intenzivni kurs', 'Strukturirani 8-nedeljni program za brz napredak kroz CEFR nivoe.', 'course', 90, 480000, 8);
  END IF;
END $$;

-- =========================================================
-- 6. SECURITY DEFINER FUNCTIONS for consent-gated access
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_teacher_of_student(_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_teacher_consents c
    JOIN public.teachers t ON t.id = c.teacher_id
    WHERE c.student_id = _student_id
      AND c.consent_granted = true
      AND t.user_id = auth.uid()
  );
$$;

-- =========================================================
-- 7. RLS: allow consenting students' analytics to teachers
-- =========================================================
CREATE POLICY "Teachers with consent can view student grammar"
  ON public.grammar_sessions FOR SELECT
  TO authenticated
  USING (public.is_teacher_of_student(user_id));

CREATE POLICY "Teachers with consent can view student talk"
  ON public.talk_sessions FOR SELECT
  TO authenticated
  USING (public.is_teacher_of_student(user_id));

CREATE POLICY "Teachers with consent can view student errors"
  ON public.error_events FOR SELECT
  TO authenticated
  USING (public.is_teacher_of_student(user_id));

CREATE POLICY "Teachers with consent can view student vocabulary"
  ON public.vocabulary_words FOR SELECT
  TO authenticated
  USING (public.is_teacher_of_student(user_id));

CREATE POLICY "Teachers with consent can view student vocab_items"
  ON public.vocab_items FOR SELECT
  TO authenticated
  USING (public.is_teacher_of_student(user_id));

CREATE POLICY "Teachers with consent can view student xp"
  ON public.user_xp FOR SELECT
  TO authenticated
  USING (public.is_teacher_of_student(user_id));

CREATE POLICY "Teachers with consent can view student profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_teacher_of_student(user_id));

CREATE POLICY "Teachers with consent can view student activities"
  ON public.activities FOR SELECT
  TO authenticated
  USING (public.is_teacher_of_student(user_id));

CREATE POLICY "Teachers with consent can view student grammar_submissions"
  ON public.grammar_submissions FOR SELECT
  TO authenticated
  USING (public.is_teacher_of_student(user_id));

-- Teachers can view their own lessons via teacher_id
CREATE POLICY "Teacher can view own lessons"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = lessons.teacher_id AND t.user_id = auth.uid())
  );

-- =========================================================
-- 8. NEW book_lesson_v2 RPC
-- =========================================================
CREATE OR REPLACE FUNCTION public.book_lesson_v2(
  p_slot_id uuid,
  p_teacher_id uuid,
  p_lesson_type_id uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_share_analytics boolean DEFAULT false,
  p_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lesson_id uuid := gen_random_uuid();
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE availability_slots
  SET status = 'booked'
  WHERE id = p_slot_id AND status = 'open' AND teacher_id = p_teacher_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ovaj termin je već zauzet. Izaberi drugi.';
  END IF;

  INSERT INTO lessons (id, user_id, slot_id, teacher_id, lesson_type_id, start_time, end_time, student_note, share_analytics)
  VALUES (v_lesson_id, v_user, p_slot_id, p_teacher_id, p_lesson_type_id, p_start, p_end, p_note, COALESCE(p_share_analytics, false));

  INSERT INTO student_teacher_consents (student_id, teacher_id, consent_granted, granted_at, revoked_at)
  VALUES (
    v_user,
    p_teacher_id,
    COALESCE(p_share_analytics, false),
    CASE WHEN p_share_analytics THEN now() ELSE NULL END,
    CASE WHEN p_share_analytics THEN NULL ELSE now() END
  )
  ON CONFLICT (student_id, teacher_id) DO UPDATE
  SET consent_granted = EXCLUDED.consent_granted,
      granted_at = CASE WHEN EXCLUDED.consent_granted THEN now() ELSE student_teacher_consents.granted_at END,
      revoked_at = CASE WHEN NOT EXCLUDED.consent_granted THEN now() ELSE NULL END,
      updated_at = now();

  RETURN v_lesson_id;
END;
$$;
