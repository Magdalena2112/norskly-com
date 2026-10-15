# Pisanje — lepši raspored teksta i slike (Obavezna vežbanja)

## Problem
U modulu Pisanje (Obavezna vežbanja) zadatak „Describe the picture" prikazuje ilustraciju, a ispod nje ceo tekst uputstva u jednom pasusu — pitanja vodilje su nagurana u isti red i teško se čita. Textarea je mala i nema brojač reči.

## Šta menjamo

1. **Pitanja vodilje kao pregledna lista**
   - U EN-A2-L01.json za WR-01 i WR-02 pitanja vodilje izdvajamo u posebnu listu (`guide`), umesto u jednom pasusu.
   - U kartici zadatka pitanja se prikazuju u posebnoj uokvirenoj kutiji „Pitanja vodilje" kao čitljiva lista sa tačkicama.

2. **Slika i tekst jedan pored drugog**
   - Kad zadatak ima ilustraciju (WR-01), na širim ekranima slika ide levo (u originalnim razmerama), a uputstvo, pitanja i polje za pisanje desno.
   - Na telefonu ostaje sve jedno ispod drugog, kao sada.

3. **Veće polje za pisanje i brojač reči**
   - Textarea za odgovor postaje višeredna (8+ redova) umesto dva reda.
   - Ispod polja brojač reči: npr. „42 / 70–90 reči", da učenik vidi koliko je napisao.

4. **Bez izmena logike**
   - AI provera, 3 pokušaja, XP i napredak ostaju potpuno isti.
   - Ostali moduli (gramatika, vokabular, čitanje…) ne menjaju izgled — novo renderovanje važi samo za zadatke za pisanje sa slikom/otvorenim odgovorom u ovom obliku.

## Tehnički detalji
- `src/content/lessons/EN-A2-L01.json` — dodati `guide: string[]` na item-e WR-01 i WR-02, skratiti `instruction` na osnovnu uputstvu.
- `src/components/lesson/LessonExercise.tsx` — za otvorene zadatke (kind open): dvokolonski raspored `sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]` kad postoji slika; kutija sa pitanjima vodilje iz `guide`; `rows={8}` i brojač reči za otvorene item-e. Slika bez crop-a, `object-contain`, u originalnim razmerama.
- Provera: typecheck + build, zatim pregled zadatka u lekciji.

## Šta ne menjamo
- Samostalnu vežbu (Opis slike / Korekcija teksta) — samo Obavezna vežbanja.
- Sadržaj zadataka, prevode, broj reči (70–90) i način ocenjivanja.
