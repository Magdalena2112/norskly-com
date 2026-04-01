

## Plan: Atomsko zakazivanje preko SECURITY DEFINER funkcije

### Problem
Booking fails because the client makes two separate calls (insert lesson, then update slot). The RLS `WITH CHECK` on `availability_slots` can't reliably see the just-inserted lesson row, causing persistent "violates row-level security policy" errors.

### Fix
Replace the two client-side calls with a single atomic `book_lesson` database function that runs as `SECURITY DEFINER`, bypassing RLS internally while still validating the caller via `auth.uid()`.

### Changes

**1. Database migration — create `book_lesson` function**

```sql
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
```

**2. `src/pages/BookLessonPage.tsx` — simplify `bookMutation`**

Replace the insert+update logic with a single RPC call:

```typescript
const { data: lessonId, error } = await supabase.rpc("book_lesson", {
  p_slot_id: selectedSlot.id,
  p_start: startTime.toISOString(),
  p_end: endTime.toISOString(),
  p_note: note || null,
});
if (error) throw error;
```

Remove the old insert/update/rollback code. Keep the email sending and activity logging as-is, using `lessonId` from the RPC result.

### Why this works
- Single database call = atomic (no race condition, no RLS visibility issue)
- `SECURITY DEFINER` bypasses RLS within the function
- `auth.uid()` still validates the caller is authenticated
- Slot is claimed before lesson is created, preventing double-booking

