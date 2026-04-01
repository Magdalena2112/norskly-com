
CREATE OR REPLACE FUNCTION public.book_lesson(
  p_slot_id uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lesson_id uuid := gen_random_uuid();
BEGIN
  -- Claim the slot atomically
  UPDATE availability_slots
  SET status = 'booked'
  WHERE id = p_slot_id AND status = 'open';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ovaj termin je već zauzet. Izaberi drugi.';
  END IF;

  -- Create lesson
  INSERT INTO lessons (id, user_id, slot_id, start_time, end_time, student_note)
  VALUES (v_lesson_id, auth.uid(), p_slot_id, p_start, p_end, p_note);

  RETURN v_lesson_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.book_lesson(uuid, timestamptz, timestamptz, text) TO authenticated;
