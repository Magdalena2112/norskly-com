# Vežbe u Vokabularu po principu Gramatike

## Šta se menja
1. **Vežbe po oblastima**: na vrhu ostaju kartice oblasti (Pozdravi, Osobe/učionica, Predmeti, Brojevi 0–20). Klik na oblast otvara njene pripremljene vežbe kao kružiće 1, 2, 3…; jedna vežba na ekranu, napred/nazad, kvačica na završenim, XP za pripremljene vežbe.
2. **Pripremljenih vežbi ima više**: svaka oblast dobija 10 vežbi (sada ih ima po 5). Oblast „Brojevi 0–20“ dobija svojih 10 vežbi (npr. upiši broj rečima, spoji cifru i reč, dopuni rečenice „I'm ___.“, „Room ___“, slušaj i izaberi broj).
3. **„Provežbaj još“ sa AI**: kada se završe pripremljene vežbe, ispod se pojavi okvir „Želiš još?“ i dugme „Provežbaj još“. AI tada pravi nove slične zadatke samo od reči te oblasti, prilagođene nivou učenika, sa kratkim i neutralnim uputstvima koja ne otkrivaju rešenje. Važe ista pravila kao u Gramatici: 3 pokušaja, bez prikaza rešenja, pa treća greška znači netačno.
4. **Prelazak na sledeću oblast**: na dnu stoji dugme „Sledeća oblast: …“.

## Tehnički detalji
- `EN-A1-L01.json`: dopuniti `vocabulary.exercises` (GI/PCF/CO 06–10, NUM 01–10) i `areas[].exercises`.
- `LessonVocabularyTab.tsx` (mode practice): dodati blok „Provežbaj još“ i dugme za sledeću oblast, isto kao u `LessonGrammarTab`.
- `vocabulary-ai`: nova akcija `generate_lesson_exercises` (reči oblasti, nivo, jezik), vraća zadatke u formatu `Exercise`, koje prikazuje postojeći `LessonExercise` (bez XP ili sa smanjenim XP, kao AI vežbe u Gramatici).
