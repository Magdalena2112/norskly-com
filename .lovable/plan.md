# Čitanje: tekstovi u 3 oblacica, vežbe ispod svakog teksta

## Cilj
Modul Čitanje u lekciji (EN-A2-L01) prikazuje se kao 3 koraka (oblačići 1–3), po jedan tekst na svakom koraku. Ispod svakog teksta odmah se prikazuju vežbe vezane za njega, umesto da su svi tekstovi i sve vežbe na jednoj strani.

## Trenutno stanje
- `EN-A2-L01.json` → `modules.reading` ima `texts` (3 teksta: RD1, RD2, RD3) i `exercises` (10 vežbi R-01–R-10).
- Vežbe su po naslovu vezane za tekst: R-01–R-03 → Tekst 1, R-04–R-06 → Tekst 2, R-07–R-10 → Tekst 3.
- `CourseLessonPage.tsx` (tab "reading") trenutno prikazuje sve tekstove jedan ispod drugog; vežbe se prikazuju odvojeno.

## Izmena
1. **Bubble stepper (1–3)** na vrhu taba Čitanje — isti vizuelni princip kao u Slušanju/Vokabularu: kružići 1, 2, 3; klik na kružić otvara taj tekst; dugme „Sledeći tekst" na dnu vodi na sledeći korak.
2. **Svaki korak prikazuje:**
   - tekst (naslov, ilustracija u dobrom kvalitetu, dugme „Slušaj", telo teksta, napomena) — postojeći prikaz, samo jedan tekst po koraku;
   - ispod teksta: vežbe koje pripadaju tom tekstu (postojeća `LessonExercise` komponenta, bez izmene logike provere/XP).
3. **Povezivanje vežbi sa tekstom:** po prefiksu u naslovu vežbe („Text 1/2/3"). Da bi veza bila stabilna i za buduće lekcije, u JSON se svakoj vežbi dodaje polje `textId` (npr. `EN-A2-L01-RD1`), a prikaz prvo gleda `textId`, pa naslov kao rezervu.
4. Napredak i XP ostaju nepromenjeni — završetak vežbi i dalje se beleži po kodu vežbe (R-01…R-10).

## Tehnički detalji
- Fajlovi: `src/pages/CourseLessonPage.tsx` (blok `tab === "reading"` → novi prikaz sa koracima), `src/content/lessons/EN-A2-L01.json` (dodato `textId` u 10 vežbi).
- Bez novih komponenti; koriste se postojeći stilovi (bubble stepper, `LessonExercise`, `ITEM_IMAGES`).
- Provera: typecheck + build; vizuelna provera taba Čitanje u pregledu lekcije.
