

## Fix: Gramatičke vežbe ponavljaju iste zadatke

### Zašto se ponavljaju
Trenutni pristup koristi `unique_seed: Date.now()` i tekstualnu instrukciju "generiši nove". Ali LLM nema informaciju o prethodnim zadacima — pa generiše iste obrasce. Takođe, `temperature: 0.7` je umerena vrednost.

### Rešenje

**1. `src/pages/GrammarPage.tsx` — slanje prethodnih rečenica AI-ju**
- Pre generisanja, dohvati iz `grammar_sessions` poslednje sesije za istog korisnika i istu temu
- Izvuci prethodne rečenice (iz `questions` JSONB kolone)
- Pošalji ih u AI poziv kao novo polje `previous_sentences` (niz stringova, max 30)

**2. `supabase/functions/grammar-ai/index.ts` — korišćenje prethodnih rečenica**
- Primi novo polje `previous_sentences` iz request body-ja
- U `generate_exercises` system promptu dodaj eksplicitan blok: "Evo rečenica koje su već korišćene — NE KORISTI ih ponovo i NE pravi slične varijante:" sa listom prethodnih rečenica
- Povećaj `temperature` sa 0.7 na 0.9 za `generate_exercises` akciju

**3. Fajlovi:**
- `src/pages/GrammarPage.tsx` — dodaj fetch prethodnih rečenica pre generisanja (~15 linija)
- `supabase/functions/grammar-ai/index.ts` — primi `previous_sentences`, ugradi u prompt, povećaj temperature (~10 linija)

