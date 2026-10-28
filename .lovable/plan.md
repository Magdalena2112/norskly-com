# Učenik vidi samo nivo na koji je upisan

## Šta se menja
- Na početnoj stranici učenja otvoren je samo nivo na koji se učenik prijavio (npr. nemački opšti A2). Ostali nivoi su prikazani kao zaključani, sa porukom „Dostupno samo za upisani nivo“.
- Niži nivoi se više ne otvaraju automatski, a viši se ne otključavaju napredovanjem.
- Ako učenik ručno otvori link lekcije sa drugog nivoa, vidi poruku da lekcija nije deo njegovog nivoa i dugme za povratak.
- Ni sadržaj lekcije ne šalje se sa servera za nivo na koji učenik nije upisan, pa ga nije moguće preuzeti zaobilaženjem prikaza.
- Administratori i profesori i dalje vide sve nivoe.

## Tehnički detalji
- `src/lib/levels.ts`: `computeLevelStates` otključava samo `startLevel`. Pravilo praga ostaje u fajlu za kasniju upotrebu. Ažurirati postojeće testove i dodati test „otključan je samo upisani nivo“.
- `CourseLessonPage.tsx`: ako je `row.cefr_level` različit od nivoa jezičkog profila (i korisnik nije admin/profesor), prikazati zaključan ekran.
- Edge funkcija `course-content`: uporediti nivo lekcije sa `language_profiles.level` korisnika, osim za admin uloge, i vratiti 403. Zatim ponovo objaviti funkciju.
- Promenu nivoa za već upisan kurs (sa stranice jezika) zadržati onakvu kakva je sada.
- U AGENTS.md / project knowledge zameniti pravilo o otključavanju nivoa novim pravilom „pristup samo upisanom nivou“.
