ALTER TABLE public.error_events ADD COLUMN IF NOT EXISTS lesson_id uuid REFERENCES public.course_lessons(id);
CREATE INDEX IF NOT EXISTS error_events_lesson_user_idx ON public.error_events(user_id, lesson_id);
CREATE POLICY "Platform admins read errors" ON public.error_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Platform admins read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Platform admins read xp" ON public.user_xp FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Platform admins read activities" ON public.activities FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Platform admins read lesson progress" ON public.course_lesson_progress FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
