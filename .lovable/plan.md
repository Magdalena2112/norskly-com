

## Plan: Automatski mejl adminu nakon zakazivanja časa

### Problem
Email adresa nastavnika u `teacher_profile` tabeli je `null`. Zbog toga se mejl nastavniku/adminu nikada ne šalje — kod proverava `if (teacherData?.email)` i preskače slanje.

Student email radi ispravno (status `sent` u logu).

### Rešenje

**1. Upisati admin email u `teacher_profile` tabelu**
- Pokrenuti SQL update da se postavi email adresa nastavnika/admina

**2. Dodati admin stranicu za unos email adrese**
- Na postojećoj `AdminTeacherProfilePage` proveriti da li postoji polje za email — ako ne, dodati ga kako bi admin mogao da ažurira svoju email adresu bez direktnog pristupa bazi

### Koraci

1. **SQL migration**: `UPDATE teacher_profile SET email = 'ADMIN_EMAIL' WHERE email IS NULL` — potrebno da korisnik unese svoju email adresu
2. **Proveriti AdminTeacherProfilePage** — dodati input polje za email ako nedostaje
3. Nikakve promene na edge funkcijama nisu potrebne — kod za slanje mejla nastavniku već postoji i radi

### Pitanje za korisnika
Potrebna mi je email adresa na koju želiš da stižu obaveštenja o zakazanim časovima.

