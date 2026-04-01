

## Poboljšanje sekcije Vežbe u Gramatici

### Problem
1. AI generiše iste/slične zadatke jer nema instrukcije da varira sadržaj
2. Maksimalan broj zadataka je ograničen na 10 (treba 20)
3. Nakon završene sesije nema dugmeta koje vodi na objašnjenje te teme

### Izmene

**1. `src/pages/GrammarPage.tsx` — ExercisesTab komponenta**
- Povećati `max` za broj zadataka sa 10 na 20 (linija 271)
- Dodati u `generate` funkciju timestamp ili random seed u AI poziv (`unique_seed: Date.now()`) da forsira raznovrsnost
- Nakon završene sesije (`allDone` blok, linije 353-363), dodati dugme "Objasni ovu temu" koje navigira na tab "explain" sa temom kao parametrom

**2. `supabase/functions/grammar-ai/index.ts` — generate_exercises prompt**
- Dodati instrukciju u system prompt: "Svaki put generiši potpuno nove i raznovrsne rečenice. Ne ponavljaj prethodne primere. Variraj kontekst, vokabular i strukturu rečenica."

### Detalji

Dugme nakon sesije:
```tsx
<Button onClick={() => {/* switch to explain tab with topic */}}>
  📖 Objasni: {topic}
</Button>
```

Za prebacivanje na tab koristiću React state (controlled tabs umesto defaultValue) ili `navigate` sa state parametrom.

Za raznovrsnost, u AI prompt dodajem eksplicitnu instrukciju + šaljem `unique_seed` koji prompt uključuje kao kontekst.

3 izmene ukupno: GrammarPage.tsx (max 20, dugme za objašnjenja, controlled tabs), grammar-ai/index.ts (prompt za raznovrsnost).

