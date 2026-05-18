ALTER TABLE public.teacher_applications ADD COLUMN IF NOT EXISTS experience text;

-- Allow verified teachers to manage their own availability slots
CREATE POLICY "Teachers can insert own slots"
ON public.availability_slots FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.teachers t
  WHERE t.id = availability_slots.teacher_id AND t.user_id = auth.uid()
));

CREATE POLICY "Teachers can update own slots"
ON public.availability_slots FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.teachers t
  WHERE t.id = availability_slots.teacher_id AND t.user_id = auth.uid()
));

CREATE POLICY "Teachers can delete own slots"
ON public.availability_slots FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.teachers t
  WHERE t.id = availability_slots.teacher_id AND t.user_id = auth.uid()
));