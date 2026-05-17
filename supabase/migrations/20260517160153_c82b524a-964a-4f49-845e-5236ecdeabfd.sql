
-- teacher_applications table
CREATE TABLE public.teacher_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  languages TEXT NOT NULL,
  bio TEXT NOT NULL,
  cv_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.teacher_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit
CREATE POLICY "Anyone can submit teacher application"
ON public.teacher_applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admins can view all
CREATE POLICY "Admins view teacher applications"
ON public.teacher_applications FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'admin_teacher'));

CREATE POLICY "Admins update teacher applications"
ON public.teacher_applications FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'admin_teacher'));

CREATE POLICY "Admins delete teacher applications"
ON public.teacher_applications FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'admin_teacher'));

CREATE TRIGGER update_teacher_applications_updated_at
BEFORE UPDATE ON public.teacher_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for CVs (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('teacher-cvs', 'teacher-cvs', false)
ON CONFLICT (id) DO NOTHING;

-- Anyone can upload to teacher-cvs
CREATE POLICY "Anyone can upload teacher CV"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'teacher-cvs');

-- Only admins can view CVs
CREATE POLICY "Admins read teacher CVs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'teacher-cvs'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'admin_teacher'))
);

CREATE POLICY "Admins delete teacher CVs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'teacher-cvs'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'admin_teacher'))
);
