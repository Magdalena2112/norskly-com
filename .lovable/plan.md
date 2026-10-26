# Gramatička vežbanja – Norveški A2, Lekcija 1

Ubacujemo svih 30 vežbi (G-01 do G-30) iz poslatog materijala u Gramatiku norveške A2 lekcije 1, sa ukupno 40 XP.

## Šta će učenik videti
- Vežbe su raspoređene po temama koje već postoje u lekciji:
  - V2 pravilo i inverzija
  - Negacija *ikke*
  - Pitanja
  - Prilozi učestalosti
  - Mešovite i složenije vežbe (G-21 do G-30)
- Jedna vežba po ekranu, sa oznakom (npr. G-07), naslovom, uputstvom na srpskom i brojem XP koje nosi.
- Na vrhu: „7/30", „8/40 XP" i traka napretka. Može se preći na sledeću vežbu i bez rešene prethodne.
- Tačan odgovor: „Tačno! +1 XP" (ili +2) i kratko objašnjenje pravila.
- Pogrešan odgovor: „Pokušaj ponovo" sa kratkim savetom. Posle dve greške pojavljuje se detaljniji savet. Rešenje se ne otkriva samo od sebe.
- Vrste vežbi: izbor odgovora (redosled se meša), slaganje reči u rečenicu (prevlačenje, uz klik kao zamenu i dugme „Resetuj"), popunjavanje praznina, ispravljanje grešaka, preoblikovanje rečenica, uparivanje pitanja i odgovora, tačno/netačno i kratak tekst sa četiri praznine (G-30).
- Kod upisanih rečenica ne računa se veliko slovo na početku, tačka na kraju ni dupli razmaci, ali se pogrešan red reči i pogrešan položaj *ikke* računaju kao greška. Prihvataju se sve ispravne varijante navedene u materijalu.

## Bodovanje
- G-01 do G-20: po 1 XP, G-21 do G-30: po 2 XP, ukupno 40.
- XP samo kada je cela vežba tačna, bez delimičnih bodova.
- Ponovno rešavanje ne donosi dodatni XP, ni posle osvežavanja stranice.
- Napredak se čuva i lekcija se nastavlja od prve nerešene vežbe.

## Šta se ne menja
Engleske lekcije, ostali moduli i postojeći sistem napretka ostaju isti.

## Provera pre završetka
Proveriću da postoji tačno 30 vežbi i da je zbir 40 XP, da svaka ima uputstvo i sve ponuđene odgovore ili reči, i da nijedan izbor nema dva tačna odgovora. Proći ću nekoliko vežbi u pregledu na računaru i na telefonu.

## Tehnički detalji
- Vežbe idu u `modules.grammar.exercises` u `NO-A2-L01.json`, sa novim opcionim poljima: `xp`, `type` (choice / order / gap / correct / transform / match / truefalse / context), `tokens`, `pairs`, `gaps`, `hint`, `hint2`, `explanation`, `grammarFocus`. Za NO-A2-L01 se dodaje unos u `LESSON_GRAMMAR_TOPICS`.
- `LessonExercise` dobija interakcije za order/match/multi-gap i režim „bez otkrivanja rešenja" za vežbe sa `hint2`. Postojeće vežbe rade kao i do sada.
- XP po vežbi ide kroz postojeće beleženje aktivnosti sa ključem `lesson:<id>:<code>` po jeziku, da se XP ne bi dodelio dvaput. Brojač XP i traka napretka idu u zaglavlje gramatičkih vežbi.
- Testovi: zbir 40 XP i 30 vežbi, provera reda reči (V2, *ikke*) i pravilo da nema dvostrukog XP.
