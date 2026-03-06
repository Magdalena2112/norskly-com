
-- vocabulary_words: stores all generated words
CREATE TABLE public.vocabulary_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  word TEXT NOT NULL,
  translation TEXT NOT NULL DEFAULT '',
  example_sentence TEXT,
  synonym TEXT,
  antonym TEXT,
  topic TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vocabulary_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own vocabulary_words" ON public.vocabulary_words FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own vocabulary_words" ON public.vocabulary_words FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vocabulary_words" ON public.vocabulary_words FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- word_collections: user-created collections
CREATE TABLE public.word_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.word_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own word_collections" ON public.word_collections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own word_collections" ON public.word_collections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own word_collections" ON public.word_collections FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own word_collections" ON public.word_collections FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- collection_words: junction table
CREATE TABLE public.collection_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.word_collections(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES public.vocabulary_words(id) ON DELETE CASCADE,
  UNIQUE(collection_id, word_id)
);

ALTER TABLE public.collection_words ENABLE ROW LEVEL SECURITY;

-- RLS via join to word_collections
CREATE POLICY "Users can insert own collection_words" ON public.collection_words FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.word_collections WHERE id = collection_id AND user_id = auth.uid()));
CREATE POLICY "Users can view own collection_words" ON public.collection_words FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.word_collections WHERE id = collection_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own collection_words" ON public.collection_words FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.word_collections WHERE id = collection_id AND user_id = auth.uid()));
