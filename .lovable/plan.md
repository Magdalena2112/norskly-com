

## Plan: Potvrdni mejl nakon zakazivanja časa

### Šta će se desiti
Nakon što učenik zakaže čas, sistem će automatski poslati potvrdni mejl:
- **Učeniku** — potvrda sa datumom, vremenom i napomenom
- **Profesoru** — obaveštenje o novom zakazanom času sa imenom učenika i napomenom

### Potrebni koraci

**1. Podešavanje email domena (prvi korak)**
Pre slanja mejlova, potrebno je podesiti email domen — to je domen sa kojeg će mejlovi stizati (npr. `notify@tvoj-domen.com`). Ovo zahteva da imaš svoj domen i da dodaš DNS zapise kod svog provajdera.

Kada klikneš dugme ispod, otvoriće se dijalog za podešavanje domena.

**2. Kreiranje email infrastrukture**
Automatski se kreira sistem za slanje mejlova (red čekanja, logovanje, ponovni pokušaji).

**3. Kreiranje email šablona**
Dva šablona:
- `lesson-booked-student` — mejl za učenika sa detaljima časa
- `lesson-booked-teacher` — mejl za profesora sa imenom učenika i detaljima

**4. Izmena BookLessonPage.tsx**
Nakon uspešnog zakazivanja, pozivaju se dva slanja mejla:
- Mejl učeniku (na email iz auth profila)
- Mejl profesoru (na email iz `teacher_profile` tabele)

**5. Kreiranje unsubscribe stranice**
Obavezna stranica za odjavu od mejlova (zakonski zahtev).

### Tehnički detalji
- Mejlovi se šalju kroz `send-transactional-email` edge funkciju
- Šabloni su React Email komponente sa brendiranim stilom
- Email profesora se čita iz `teacher_profile` tabele (treba proveriti da li postoji email kolona)
- Idempotency key: `lesson-student-{lessonId}` i `lesson-teacher-{lessonId}`

### Prvi korak sada
Pošto email domen još nije podešen, potrebno je prvo to uraditi:

<lov-actions>
<lov-open-email-setup>Podesi email domen</lov-open-email-setup>
</lov-actions>

