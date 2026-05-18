-- Add language column to all student/teacher tables for multi-language support
-- Default 'no' (Norwegian) so existing data is preserved

ALTER TABLE public.reading_sessions ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'no';
ALTER TABLE public.grammar_sessions ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'no';
ALTER TABLE public.grammar_submissions ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'no';
ALTER TABLE public.saved_explanations ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'no';
ALTER TABLE public.talk_sessions ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'no';
ALTER TABLE public.vocab_items ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'no';
ALTER TABLE public.vocabulary_words ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'no';
ALTER TABLE public.word_collections ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'no';
ALTER TABLE public.writing_exercises ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'no';
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'no';
ALTER TABLE public.error_events ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'no';

ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'no';
ALTER TABLE public.availability_slots ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'no';
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'no';
ALTER TABLE public.lesson_types ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'no';

-- Helpful indexes for per-language history queries
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_lang ON public.reading_sessions(user_id, language, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grammar_sessions_user_lang ON public.grammar_sessions(user_id, language, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_talk_sessions_user_lang ON public.talk_sessions(user_id, language, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_vocab_items_user_lang ON public.vocab_items(user_id, language);
CREATE INDEX IF NOT EXISTS idx_vocabulary_words_user_lang ON public.vocabulary_words(user_id, language);
CREATE INDEX IF NOT EXISTS idx_writing_exercises_user_lang ON public.writing_exercises(user_id, language, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_lang ON public.activities(user_id, language, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teachers_active_lang ON public.teachers(language, is_active);