
## Cilj

Posle registracije i izbora "Learning + Lessons" plana, učenik prolazi kroz: **Izbor nastavnika → Izbor tipa časa → Izbor termina → Consent o deljenju napretka → Potvrda**. Nastavnik dobija email i vidi učenika u svom dashboard-u (sa analitikom samo ako je consent dat).

---

## 1. Baza (jedna migracija)

### Nove tabele

- **`teachers`** — multi-teacher profil: `id`, `user_id` (link na auth.users, unique nullable), `name`, `bio`, `photo_url`, `spoken_languages text[]`, `focus text[]`, `rating numeric`, `students_count int`, `meet_link`, `email`, `is_active bool`, `is_verified bool`, timestamps.
  - Seed: prebaci postojeći jedini red iz `teacher_profile` u `teachers` i link-uj na `magdalenaradojevic75@gmail.com`.
  - `teacher_profile` ostaje radi backward-kompatibilnosti (admin teacher profil), ali svi flows čitaju iz `teachers`.

- **`lesson_types`** — `id`, `teacher_id → teachers`, `title`, `description`, `kind` ('individual' | 'group' | 'course'), `duration_minutes`, `price_cents`, `currency` (default 'NOK'), `capacity int`, `language`, `is_active`.
  - Seed: za postojećeg nastavnika napravi 3 default tipa (individual 90min, group 60min, course).

- **`student_teacher_consents`** — `id`, `student_id`, `teacher_id`, `consent_granted bool`, `granted_at`, `revoked_at`, unique `(student_id, teacher_id)`.

### Izmene postojećih tabela

- **`availability_slots`**: dodati `teacher_id → teachers` (nullable za migraciju, posle backfill-a NOT NULL).
- **`lessons`**: dodati `teacher_id → teachers`, `lesson_type_id → lesson_types`, `share_analytics bool default false` (snapshot consent-a u trenutku booking-a).
- **`book_lesson` RPC**: proširiti potpis sa `p_teacher_id`, `p_lesson_type_id`, `p_share_analytics`. Funkcija atomično: claim-uje slot, upisuje lesson sa tim poljima i upsert-uje consent u `student_teacher_consents`.

### RLS

- `teachers`: SELECT za sve authenticated (`is_active = true`); UPDATE/INSERT samo `admin` ili sam nastavnik (`user_id = auth.uid()`).
- `lesson_types`: SELECT public (active); CRUD samo vlasnik teacher ili admin.
- `student_teacher_consents`: student vidi/menja svoje; nastavnik vidi gde je `teacher_id` njegov (preko `teachers.user_id = auth.uid()`).
- **Security definer funkcije za consent-gated analytics** (rešava RLS rekurziju):
  - `has_consent(_student uuid, _teacher_user uuid) returns bool`
  - `is_teacher_of(_student uuid)` — true ako trenutni user ima approved lesson sa studentom **i** consent.
- Dopune RLS na `grammar_sessions`, `talk_sessions`, `error_events`, `vocabulary_words`, `user_xp`, `profiles`: dodati policy "Teachers can view consented students" preko `is_teacher_of(user_id)`. (`admin_teacher` policy ostaje netaknut.)

---

## 2. Frontend — onboarding flow

Posle `/auth` (kad je plan = "lessons"), redirect kroz:

1. **`/onboarding`** (postojeći student onboarding — ostaje).
2. **`/select-teacher`** (novo) — grid kartica nastavnika.
3. **`/select-teacher/:id`** (novo) — detaljni pregled + tip časa + termin + consent toggle + potvrda.
4. **`/booking/success/:lessonId`** (novo) — confirmation screen.

Routing logika: u `App.tsx` postojeći `ProtectedRoute` redirect (ili u `OnboardingPage` posle završetka) — ako `selected_plan === 'lessons'` i nema lekcija → `/select-teacher`; inače → `/practice`.

### `/select-teacher` (TeacherSelectionPage)
- Header sa `JourneyStepper` (dodati novi korak "Nastavnik" pre "Učenje").
- Grid kartica: foto, ime, bio (truncate), jezici (chips), fokus, rating, "od X NOK / čas", CTA "Pogledaj profil".
- Filter chip-ovi po jeziku (kasnije, ne MVP).

### `/select-teacher/:id` (TeacherBookingPage — proširen `TeacherProfilePage`)
- **Sekcija 1**: profil nastavnika (foto, bio, jezici, fokus, rating).
- **Sekcija 2**: izbor `lesson_type` — segmented cards (Individual / Group / Course) sa cenom i trajanjem.
- **Sekcija 3**: kalendar sa slot-ovima filtrirani po `teacher_id` i (po potrebi) `duration_minutes`.
- **Sekcija 4**: napomena (textarea).
- **Sekcija 5 — Consent kartica** (elegantna sa `Switch` + ikona štita):
  > "Dozvoljavam ovom profesoru pristup mom napretku, greškama i istoriji učenja radi personalizovanije nastave."
  Default: off. Mali helper tekst: "Možeš opozvati u Podešavanjima u svakom trenutku."
- **CTA**: "Potvrdi rezervaciju" → poziva `book_lesson` RPC sa svim parametrima → `supabase.functions.invoke('send-transactional-email', ...)` → `navigate('/booking/success/:id')`.

### `/booking/success/:lessonId` (BookingSuccessPage)
- Animated checkmark, summary kartica (nastavnik, tip, datum/vreme, share status), CTA "Idi na časove" → `/my-lessons` i "Počni vežbu" → `/practice`.

### `MyLessonsPage`
- Proširiti listing da uključuje `teachers.name`, `lesson_types.title`.

### Settings (Profile)
- Mini sekcija "Privatnost" sa listom nastavnika i toggle-om consent-a (upsert u `student_teacher_consents`).

---

## 3. Email notifikacija nastavniku

Novi React Email template `_shared/transactional-email-templates/teacher-lesson-booking.tsx`:
- Polja: `studentName`, `studentLanguage`, `lessonType`, `dateLabel`, `timeLabel`, `note`, `analyticsShared: boolean`, `dashboardUrl`.
- Subject: "Novi čas zakazan — {studentName}".
- Body koristi postojeću cream/burgundy paletu, jasan info-block, CTA dugme "Otvori dashboard".
- Visible badge "✓ Pristup analitici odobren" ili "🔒 Pristup analitici nije odobren".

Registrovati u `registry.ts`. Posle booking-a, frontend poziva:
```ts
supabase.functions.invoke('send-transactional-email', {
  body: {
    templateName: 'teacher-lesson-booking',
    recipientEmail: teacher.email,
    idempotencyKey: `teacher-booking-${lessonId}`,
    templateData: { ... }
  }
})
```
Deploy `send-transactional-email`.

---

## 4. Nastavnik dashboard

- **Postojeći** `/admin/*` ostaje za admin teacher-a (vidi sve).
- **Novi `/teacher/*` prostor** (zaštićen novim `TeacherRoute` koji proverava da li user ima red u `teachers` sa `user_id = auth.uid()`):
  - `/teacher/dashboard` — KPI: predstojeći časovi, broj učenika koji su dali consent.
  - `/teacher/students` — lista samo onih učenika koji su imali čas sa ovim nastavnikom. Za svakog se prikazuje badge "Analitika: deljena / privatna".
  - `/teacher/students/:id` — ako consent dat: reuse `StudentProgressView`, `StudentErrorAnalysis` komponente filtrirane preko RLS. Ako nije: prikaži samo osnovne info i prazno stanje sa porukom "Ovaj učenik nije podelio analitiku."
  - `/teacher/lessons` — slično `/admin/lessons` ali filtrirano na `teacher_id`.

Sav data fetch oslanja se na nove RLS policies — nastavnik koji nije admin_teacher dobija samo dozvoljene redove.

---

## 5. UX / Design

- Cream / burgundy / pastel pink + postojeća Aurora pozadina; rounded-3xl kartice, glassmorphism.
- Framer Motion: stagger animacije na grid kartica nastavnika, slide-in consent kartice, animirani checkmark na success.
- 390px mobilni: vertikalni stack, scroll-snap za lesson type segmented control.
- Sve UI tekstove na srpskoj latinici.

---

## 6. Tehnički detalji (collapsed)

- Svi RPC pozivi async; optimistic UI tek nakon successful response.
- `book_lesson` RPC mora da bude jedna transakcija (claim slot + insert lesson + upsert consent).
- Snapshot `share_analytics` na `lessons` čuvamo za audit (ne menja se ako student kasnije opozove consent — opoziv utiče samo na *buduće* pristupe analitici, ne na to šta je pisalo u poslatom emailu).
- Idempotency key za email = `teacher-booking-${lessonId}`.
- Postojeći `book_lesson` poziv u `TeacherProfilePage` zameniti novim potpisom u istom fajlu (refaktor u `TeacherBookingPage`).
- Memory update posle implementacije: novi fajlovi `mem://features/teachers-marketplace`, `mem://features/consent-system`, plus update Core za multi-teacher arhitekturu.

---

## Redosled koraka tokom build-a

1. Migracija (tabele + RLS + RPC izmene + seed) — čeka odobrenje korisnika.
2. Email template + deploy.
3. Frontend: `TeacherSelectionPage`, refactored `TeacherBookingPage`, `BookingSuccessPage`, route izmene u `App.tsx`.
4. Postojeći `MyLessonsPage` proširenje.
5. `TeacherRoute` + `/teacher/*` strane (reuse postojećih admin komponenti).
6. Privacy toggle u settings-u.
7. Memory updates.
