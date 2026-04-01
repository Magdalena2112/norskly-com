ALTER TABLE public.profiles
  ADD COLUMN preferred_tone text DEFAULT 'opušten',
  ADD COLUMN lives_in_norway boolean DEFAULT false;