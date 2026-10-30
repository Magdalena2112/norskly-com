DROP POLICY IF EXISTS "Authenticated can read vocab images" ON public.vocab_images;
CREATE POLICY "Signed-in users can read vocab images" ON public.vocab_images FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
CREATE POLICY "Users can view own avatar objects" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);