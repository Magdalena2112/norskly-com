## Cilj

Povećati dugmad za izbor jezika ("Norveški / Engleski / Nemački") u hero sekciji landing stranice tako da budu vizuelno istaknutija.

## Izmena

U `src/pages/LandingPage.tsx`, na pill linkovima za jezike (mapa `LANGUAGE_CONFIGS`):

- Padding: sa `px-5 py-2.5` na `px-7 py-4` (veće dodirno polje).
- Font: sa `text-sm` na `text-base md:text-lg` i `font-semibold`.
- Zastavica/ikona veća: `text-xl` na flag span.
- Razmak između pill-ova: `gap-2` → `gap-3`.
- Donja margina celog reda: ostaje `mb-10`.

Bez izmena u logici (i dalje vodi na `/jezici/:slug` i upisuje izbor u localStorage).

## Šta NIJE u opsegu

- Promena boja, oblika (ostaje pill/rounded-full) ili animacija.
- Druga dugmad na stranici.