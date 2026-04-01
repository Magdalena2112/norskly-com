ALTER TABLE public.vocabulary_words ADD COLUMN IF NOT EXISTS word_type text DEFAULT null;
ALTER TABLE public.vocabulary_words ADD COLUMN IF NOT EXISTS grammar_forms jsonb DEFAULT null;