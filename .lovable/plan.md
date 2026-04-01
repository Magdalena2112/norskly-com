

## Plan: Fix Student Booking — Swap Insert Order

### Problem
The "Students can book open slots" RLS policy on `availability_slots` has a WITH CHECK that requires a matching row in `lessons` before allowing the update. But the code in `BookLessonPage.tsx` updates the slot first (line 48-53), then inserts the lesson (line 59-66). Since the lesson doesn't exist yet when the slot update runs, RLS blocks it and returns 0 rows, causing "Ovaj termin je već zauzet."

### Fix

**File: `src/pages/BookLessonPage.tsx`**

Swap the order of operations in `bookMutation`:
1. **First** insert the lesson into `lessons` table
2. **Then** update the `availability_slots` status to `booked`
3. If the slot update fails (already booked by someone else), delete the lesson as rollback

This way, when the slot update runs, the RLS WITH CHECK finds the lesson row and allows the update.

### Technical Detail
```
Current:  update slot → insert lesson  (fails: RLS needs lesson to exist)
Fixed:    insert lesson → update slot → rollback lesson if slot taken
```

Only `BookLessonPage.tsx` needs changes. No database migration required.

