

## Problem

Greška "duplicate key value violates unique constraint idx_lessons_slot_active" nastaje jer:

1. Učenik zakaže čas → lekcija se upiše u bazu ✅
2. Kod pokuša da ažurira slot status na "booked" → **RLS blokira** jer samo admin može da ažurira slotove ❌
3. Slot ostaje "open" sa postojećom lekcijom
4. Učenik pokuša ponovo → unique constraint blokira drugi pokušaj

### Uzrok
Tabela `availability_slots` ima UPDATE polisu samo za admin/admin_teacher uloge. Učenik nema pravo da menja status slota.

Takođe, postoje 3 "zaglavljena" slota u bazi koja treba popraviti.

## Plan

**1. Dodati RLS polisu za studente da mogu da označe slot kao "booked"**
- Nova UPDATE polisa na `availability_slots` koja dozvoljava authenticated korisnicima da ažuriraju status sa 'open' na 'booked'
- Ograničiti da se može menjati SAMO `status` kolona

**2. Popraviti zaglavljena stanja u bazi**
- Ažurirati 3 slota koji imaju lekcije ali su i dalje "open" na status "booked"

**3. Poboljšati BookLessonPage.tsx**
- Obrnuti redosled: prvo ažurirati slot na "booked", pa onda insertovati lekciju — ovo sprečava orphane
- Dodati bolju poruku greške za korisnika ako slot nije više dostupan

### Tehnički detalji

**Migracija:**
```sql
-- Dozvoli studentima da označe slot kao zauzet
CREATE POLICY "Students can book open slots"
  ON public.availability_slots FOR UPDATE
  TO authenticated
  USING (status = 'open')
  WITH CHECK (status = 'booked');

-- Popravka zaglaveljnih slotova
UPDATE availability_slots SET status = 'booked'
WHERE id IN (
  SELECT slot_id FROM lessons WHERE status = 'scheduled'
) AND status = 'open';
```

**BookLessonPage.tsx izmena:** Obrnuti redosled operacija — prvo zauzmi slot, pa onda kreiraj lekciju. Ako slot update vrati 0 redova, znači da ga je neko već zauzeo.

