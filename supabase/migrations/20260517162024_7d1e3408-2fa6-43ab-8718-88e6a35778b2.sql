
-- Ensure bucket stays private with size + type constraints
UPDATE storage.buckets
SET public = false,
    file_size_limit = 10485760, -- 10 MB
    allowed_mime_types = ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
WHERE id = 'teacher-cvs';

-- Drop duplicate / existing teacher-cvs policies and recreate cleanly
DROP POLICY IF EXISTS "Admins can read teacher cvs" ON storage.objects;
DROP POLICY IF EXISTS "Admins read teacher CVs" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete teacher CVs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload teacher CV" ON storage.objects;

-- Only admins can read CVs (used by createSignedUrl)
CREATE POLICY "teacher_cvs_admin_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'teacher-cvs'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_teacher'::app_role))
);

-- Only admins can delete CVs
CREATE POLICY "teacher_cvs_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'teacher-cvs'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_teacher'::app_role))
);

-- Public application form can upload, but only into this bucket and with a safe extension
CREATE POLICY "teacher_cvs_public_upload"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'teacher-cvs'
  AND (
    lower(name) LIKE '%.pdf'
    OR lower(name) LIKE '%.doc'
    OR lower(name) LIKE '%.docx'
  )
);
-- No UPDATE policy → updates implicitly denied for everyone
