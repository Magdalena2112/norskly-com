
CREATE TABLE IF NOT EXISTS public.language_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  language text NOT NULL DEFAULT 'no',
  level text DEFAULT 'A1',
  learning_goal text DEFAULT '',
  focus_area text DEFAULT '',
  confidence_level integer DEFAULT 3,
  preferred_tone text DEFAULT 'opušten',
  lives_in_norway boolean DEFAULT false,
  subscription_type text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, language)
);

ALTER TABLE public.language_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own language_profiles"
  ON public.language_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own language_profiles"
  ON public.language_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own language_profiles"
  ON public.language_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all language_profiles"
  ON public.language_profiles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin_teacher'::app_role));

CREATE POLICY "Teachers with consent can view student language_profiles"
  ON public.language_profiles FOR SELECT TO authenticated
  USING (is_teacher_of_student(user_id));

CREATE TRIGGER update_language_profiles_updated_at
  BEFORE UPDATE ON public.language_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill: copy existing profile onboarding into the user's currently preferred language (default Norwegian).
INSERT INTO public.language_profiles (user_id, language, level, learning_goal, focus_area, confidence_level, preferred_tone, lives_in_norway, subscription_type, onboarding_completed)
SELECT
  p.user_id,
  CASE p.preferred_language
    WHEN 'engleski' THEN 'en'
    WHEN 'nemacki' THEN 'de'
    ELSE 'no'
  END AS language,
  COALESCE(p.level, 'A1'),
  COALESCE(p.learning_goal, ''),
  COALESCE(p.focus_area, ''),
  COALESCE(p.confidence_level, 3),
  COALESCE(p.preferred_tone, 'opušten'),
  COALESCE(p.lives_in_norway, false),
  p.subscription_type,
  COALESCE(p.onboarding_completed, false)
FROM public.profiles p
WHERE p.onboarding_completed = true
ON CONFLICT (user_id, language) DO NOTHING;
