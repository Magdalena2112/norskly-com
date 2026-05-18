
-- Writing exercises table
CREATE TABLE public.writing_exercises (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  exercise_type text NOT NULL CHECK (exercise_type IN ('image', 'text')),
  image_path text,
  original_text text NOT NULL DEFAULT '',
  corrected_text text,
  analysis jsonb NOT NULL DEFAULT '{}'::jsonb,
  vocabulary jsonb NOT NULL DEFAULT '{}'::jsonb,
  level text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_writing_exercises_user_created ON public.writing_exercises(user_id, created_at DESC);

ALTER TABLE public.writing_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own writing exercises"
  ON public.writing_exercises FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own writing exercises"
  ON public.writing_exercises FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own writing exercises"
  ON public.writing_exercises FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own writing exercises"
  ON public.writing_exercises FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all writing exercises"
  ON public.writing_exercises FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin_teacher'::app_role));

CREATE POLICY "Teachers with consent can view student writing"
  ON public.writing_exercises FOR SELECT TO authenticated
  USING (is_teacher_of_student(user_id));

CREATE TRIGGER trg_writing_exercises_updated_at
  BEFORE UPDATE ON public.writing_exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Private storage bucket for uploaded writing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('writing-images', 'writing-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users access only their own folder (first path segment == auth.uid())
CREATE POLICY "Users can view own writing images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'writing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own writing images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'writing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own writing images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'writing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own writing images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'writing-images' AND auth.uid()::text = (storage.foldername(name))[1]);
