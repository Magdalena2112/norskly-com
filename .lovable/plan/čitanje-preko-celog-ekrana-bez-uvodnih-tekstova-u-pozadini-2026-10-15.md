# Čitanje preko celog ekrana — bez uvodnih tekstova u pozadini

## Problem
Kada se u lekciji otvori modul Čitanje, iznad njega i dalje stoje prikazani uvodni tekstovi lekcije ("Uvodni tekstovi" sekcija sa ilustracijama i plejerima), pa modul ne zauzima ceo ekran kao ostali moduli.

## Rešenje
Sakriti sekciju "Uvodni tekstovi" kad god je otvoren bilo koji modul, ne samo Čitanje. Tako se ponašanje ujednačava za sve module koji se renderuju unutar stranice lekcije (Čitanje, Slušanje, Izgovor, Razgovor, Kultura, Ponavljanje), dok se pri zatvaranju modula ("Svi moduli") uvodni tekstovi ponovo prikazuju.

## Promene
- `src/pages/CourseLessonPage.tsx`
  - Uslov za render uvodnih tekstova: `content.intro.length > 0` postaje `content.intro.length > 0 && !open` (kada je modul otvoren, uvodni tekstovi se ne prikazuju).
  - Bez drugih izmena: bubble stepper od 3 teksta, vežbe ispod svakog teksta, napredak i XP ostaju isti.

## Provera
- `bunx tsgo --noEmit -p tsconfig.app.json` i build log.
- Vizuelna provera: otvoriti Čitanje — iznad njega nema uvodnih tekstova; klik na "Svi moduli" ih vraća.
