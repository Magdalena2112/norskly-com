
-- 1. Update trigger to allow students to cancel their own lessons
CREATE OR REPLACE FUNCTION public.enforce_lesson_update_restrictions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Admins can do anything
  IF has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'admin_teacher') THEN
    RETURN NEW;
  END IF;

  -- Students can cancel their own scheduled lessons
  IF OLD.user_id = auth.uid()
     AND OLD.status = 'scheduled'
     AND NEW.status = 'cancelled'
     AND NEW.start_time = OLD.start_time
     AND NEW.end_time = OLD.end_time
     AND NEW.slot_id = OLD.slot_id
     AND NEW.user_id = OLD.user_id
  THEN
    RETURN NEW;
  END IF;

  -- Students can only update the note
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.start_time IS DISTINCT FROM OLD.start_time
     OR NEW.end_time IS DISTINCT FROM OLD.end_time
     OR NEW.slot_id IS DISTINCT FROM OLD.slot_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
  THEN
    RAISE EXCEPTION 'You can only update the note on your lesson';
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Add RLS policy for students to reopen slots when cancelling
CREATE POLICY "Students can reopen cancelled slots"
ON public.availability_slots
FOR UPDATE
TO authenticated
USING (status = 'booked')
WITH CHECK (
  status = 'open'
  AND EXISTS (
    SELECT 1 FROM public.lessons
    WHERE lessons.slot_id = availability_slots.id
      AND lessons.user_id = auth.uid()
      AND lessons.status = 'cancelled'
  )
);
