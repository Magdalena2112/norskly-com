
-- 1. Drop the old permissive user UPDATE policy
DROP POLICY IF EXISTS "Users can update own lessons" ON public.lessons;

-- 2. Create a restricted policy: users can only update student_note
-- We use a WITH CHECK that ensures non-note columns haven't changed
-- Simplest approach: grant column-level UPDATE via a trigger that blocks changes

-- Create trigger to restrict non-admin updates to student_note only
CREATE OR REPLACE FUNCTION public.enforce_lesson_update_restrictions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins can change anything
  IF has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Non-admins: only student_note can change
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

CREATE TRIGGER enforce_lesson_update_restrictions
BEFORE UPDATE ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.enforce_lesson_update_restrictions();

-- 3. Re-create a simple user UPDATE policy (trigger handles column restriction)
CREATE POLICY "Users can update own lesson note"
ON public.lessons
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
