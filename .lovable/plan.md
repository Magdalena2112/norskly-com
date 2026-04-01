

# Bezbednosni pregled i plan zaštite baze podataka

Pokrenuo sam skeniranje bezbednosti tvog projekta i pronašao **10 problema** — od toga **3 kritična (error)** i **7 upozorenja (warn)**.

## Pronađeni problemi

### Kritični problemi (moraju se odmah rešiti)

1. **Svi korisnici mogu čitati sve zakazane časove** — Tabela `lessons` ima SELECT polisu `USING (true)`, što znači da svaki ulogovani korisnik može videti rezervacije, beleške i statuse svih drugih korisnika. Treba ograničiti na `auth.uid() = user_id`.

2. **Svaki korisnik može menjati profil profesora** — Tabela `teacher_profile` ima UPDATE polisu `USING (true)`. Bilo ko ulogovan može da promeni ime, bio, rating, meet link profesora. Treba ograničiti na konkretnog admin/teacher korisnika.

3. **Svaki korisnik može manipulisati rasporedom profesora** — Tabela `availability_slots` ima INSERT, UPDATE i DELETE polise sa `USING (true)`. Bilo ko može da dodaje, menja i briše termine. Treba ograničiti pisanje na admina.

### Upozorenja

4. **5x "RLS Policy Always True"** — Više tabela koristi previše otvorene polise (`true` za write operacije).

5. **Zaštita od procurelih lozinki je isključena** — HIBP provera nije aktivirana, pa korisnici mogu koristiti kompromitovane lozinke.

6. **Korisnici ne mogu ažurirati svoje reči** — Tabela `vocabulary_words` nema UPDATE polisu.

## Plan implementacije

### Korak 1: Kreirati admin sistem (user_roles tabela)
- Kreirati `app_role` enum i `user_roles` tabelu
- Kreirati `has_role()` security definer funkciju
- Dodeliti admin ulogu tvom korisničkom nalogu

### Korak 2: Popraviti RLS polise za `teacher_profile`
- UPDATE: `USING (public.has_role(auth.uid(), 'admin'))`

### Korak 3: Popraviti RLS polise za `availability_slots`
- INSERT/UPDATE/DELETE: ograničiti na admina pomoću `has_role()`
- SELECT: ostaviti `USING (true)` (korisnici treba da vide slobodne termine)

### Korak 4: Popraviti RLS polise za `lessons`
- SELECT: `USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))`
- UPDATE (admin): ograničiti na admina
- INSERT: ostaviti `auth.uid() = user_id`

### Korak 5: Dodati UPDATE polisu za `vocabulary_words`
- `USING (auth.uid() = user_id)`

### Korak 6: Aktivirati HIBP zaštitu lozinki
- Uključiti proveru kompromitovanih lozinki u podešavanjima autentifikacije

### Tehnički detalji

Sve promene se izvode kroz SQL migracije. Koristi se `user_roles` tabela sa `has_role()` funkcijom kako bi se izbegla rekurzija u RLS polisama. Profil profesora i raspored se štite admin ulogom, a korisničke tabele ostaju ograničene na `auth.uid() = user_id`.

Biće potrebno da mi kažeš koji email koristiš za admin nalog kako bih ti dodelila admin ulogu.

