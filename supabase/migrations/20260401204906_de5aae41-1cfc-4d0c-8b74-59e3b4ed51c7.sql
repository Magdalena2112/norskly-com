CREATE POLICY "Students can book open slots"
  ON public.availability_slots FOR UPDATE
  TO authenticated
  USING (status = 'open')
  WITH CHECK (status = 'booked');