
ALTER TABLE public.profiles ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;

UPDATE public.profiles SET onboarding_completed = true WHERE display_name IS NOT NULL AND display_name != '';
