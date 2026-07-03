
-- 1) Lessons: restrict students to only student_note and share_analytics column updates
--    (status changes to 'cancelled' remain permitted via trigger + status column grant)
REVOKE UPDATE ON public.lessons FROM authenticated;
GRANT UPDATE (student_note, share_analytics, status) ON public.lessons TO authenticated;

-- 2) teacher-cvs bucket: keep anonymous submissions possible (application form is public),
--    but add hard file-size limit and stricter path/name constraints to prevent flooding
DROP POLICY IF EXISTS teacher_cvs_public_upload ON storage.objects;

CREATE POLICY teacher_cvs_public_upload
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'teacher-cvs'
  AND (storage.foldername(name))[1] = 'applications'
  AND length(name) <= 200
  AND (lower(name) LIKE '%.pdf' OR lower(name) LIKE '%.doc' OR lower(name) LIKE '%.docx')
  AND COALESCE((metadata->>'size')::bigint, 0) <= 5242880  -- 5MB max
  AND COALESCE((metadata->>'size')::bigint, 1) > 0
);
