CREATE TABLE public.vocab_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language text NOT NULL,
  word_key text NOT NULL,
  word text NOT NULL,
  translation text,
  is_visual boolean NOT NULL DEFAULT true,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (language, word_key)
);
GRANT SELECT ON public.vocab_images TO authenticated;
GRANT ALL ON public.vocab_images TO service_role;
ALTER TABLE public.vocab_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read vocab images" ON public.vocab_images FOR SELECT TO authenticated USING (true);