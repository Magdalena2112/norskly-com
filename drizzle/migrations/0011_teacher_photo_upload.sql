CREATE POLICY "Teachers can upload own photos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'teacher-photos' AND has_role(auth.uid(), 'teacher'::app_role) AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Teachers can update own photos" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'teacher-photos' AND has_role(auth.uid(), 'teacher'::app_role) AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Teachers can delete own photos" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'teacher-photos' AND has_role(auth.uid(), 'teacher'::app_role) AND (storage.foldername(name))[1] = auth.uid()::text);