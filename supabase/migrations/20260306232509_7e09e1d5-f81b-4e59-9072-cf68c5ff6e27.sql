
-- Teacher profile table (singleton - one teacher)
CREATE TABLE public.teacher_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Ingrid Haugen',
  bio text NOT NULL DEFAULT '',
  focus text[] NOT NULL DEFAULT ARRAY['Konverzacija', 'Gramatika', 'Poslovni norveški', 'Priprema za Norskprøven'],
  duration_minutes integer NOT NULL DEFAULT 90,
  rating numeric(2,1) NOT NULL DEFAULT 4.9,
  students_count integer NOT NULL DEFAULT 120,
  photo_url text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.teacher_profile ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read
CREATE POLICY "Anyone can view teacher profile"
  ON public.teacher_profile FOR SELECT
  TO authenticated
  USING (true);

-- Anyone authenticated can update (admin protection is app-level for now)
CREATE POLICY "Authenticated can update teacher profile"
  ON public.teacher_profile FOR UPDATE
  TO authenticated
  USING (true);

-- Insert seed row
INSERT INTO public.teacher_profile (name, bio, focus, duration_minutes, rating, students_count)
VALUES (
  'Ingrid Haugen',
  'Sertifikovani profesor norveškog jezika sa više od 8 godina iskustva u podučavanju stranih studenata. Specijalizovana za komunikativni pristup i prilagođavanje nastave individualnim potrebama svakog studenta.',
  ARRAY['Konverzacija', 'Gramatika', 'Poslovni norveški', 'Priprema za Norskprøven'],
  90,
  4.9,
  120
);

-- Storage bucket for teacher photos
INSERT INTO storage.buckets (id, name, public) VALUES ('teacher-photos', 'teacher-photos', true);

-- Allow authenticated users to upload to teacher-photos
CREATE POLICY "Authenticated can upload teacher photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'teacher-photos');

CREATE POLICY "Anyone can view teacher photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'teacher-photos');

CREATE POLICY "Authenticated can update teacher photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'teacher-photos');

CREATE POLICY "Authenticated can delete teacher photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'teacher-photos');
