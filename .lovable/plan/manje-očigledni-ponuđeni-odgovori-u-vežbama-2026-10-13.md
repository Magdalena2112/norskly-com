# Manje očigledni ponuđeni odgovori u vežbama

## Cilj
U vežbama sa više ponuđenih odgovora (vokabular i gramatika lekcije) pogrešne opcije trenutno često odaju rešenje — npr. uz „Which phrase means 'Drago mi je'?" stoje opcije iz potpuno različitih kategorija („See you", „How are you?"), pa je tačan odgovor očigledan i bez znanja.

## Izmena 1: Pripremljene vežbe u `src/content/lessons/EN-A1-L01.json`
Proći kroz sve stavke sa `options` u vokabularskim (GI, PCF, CO, NUM) i gramatičkim (PR, TB, AR) vežbama i popraviti distraktore:

- Sve opcije moraju biti iz **iste kategorije** (sve fraze za predstavljanje, svi glagoli, svi brojevi, sve reči za osećanja...), pa svaka deluje verovatno.
- Distraktori moraju biti **plauzibilni za nivo A1** — tipične greške učenika (npr. za „Drago mi je": „Nice to meet you", „Pleased to meet you", „How do you do"), ne nasumične fraze.
- Uputstva ostaju kratka i neutralna, bez nagovštaja.
- Mešati poziciju tačnog odgovora (da nije uvek na istom mestu).

## Izmena 2: AI generisanje u `supabase/functions/vocabulary-ai/index.ts`
Dopuniti prompt pravilom: ponuđeni odgovori moraju biti iz iste gramatičke/leksičke kategorije, svi plauzibilni, bez opcija koje se odmah eliminišu; zabraniti hintove u uputstvima (već delimično pokriveno). Isto pravilo proveriti/primeniti u `grammar-ai` funkciji ako tamo generiše opcije.

## Tehnički detalji
- Samo JSON sadržaj i prompt tekst — bez izmena UI logike.
- `LessonExercise.tsx` već meša opcije ili prikazuje redom; proveriti da se pozicija tačnog odgovora ne odaje (ako treba, dodati shuffle prikaza opcija).
- Deploy `vocabulary-ai` (i `grammar-ai` ako se menja) nakon izmene.

## Provera
- Typecheck/build.
- Vizuelno otvoriti 2–3 vežbe sa opcijama i potvrditi da distraktori deluju verovatno.
