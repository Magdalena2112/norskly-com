
-- Activities table
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module TEXT NOT NULL CHECK (module IN ('grammar', 'vocabulary', 'talk', 'quiz')),
  type TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities" ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_activities_user_id ON public.activities (user_id);
CREATE INDEX idx_activities_module ON public.activities (user_id, module);

-- Vocab items table
CREATE TABLE public.vocab_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  theme TEXT NOT NULL,
  word TEXT NOT NULL,
  synonym TEXT,
  antonym TEXT,
  examples JSONB DEFAULT '[]',
  user_sentence TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'learning', 'mastered')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vocab_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vocab" ON public.vocab_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vocab" ON public.vocab_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vocab" ON public.vocab_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vocab" ON public.vocab_items FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_vocab_user_id ON public.vocab_items (user_id);
CREATE INDEX idx_vocab_status ON public.vocab_items (user_id, status);

-- Grammar submissions table
CREATE TABLE public.grammar_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic TEXT NOT NULL,
  user_text TEXT NOT NULL,
  corrected_text TEXT,
  explanations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.grammar_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own grammar submissions" ON public.grammar_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own grammar submissions" ON public.grammar_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_grammar_user_id ON public.grammar_submissions (user_id);
