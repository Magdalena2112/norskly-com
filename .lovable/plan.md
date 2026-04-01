

## Plan: Prikaži član (en/ei/et) pored imenica

### Šta
Za reči tipa "imenica", prikazati gramatički rod (en/ei/et) kao mali badge pored word type labele, direktno vidljiv bez otvaranja gramatičke sekcije.

### Kako

**File: `src/components/VocabWordCard.tsx`**

1. Nakon što se odredi `typeInfo`, proveriti da li je `wordType === "imenica"` i da li `grammarForms?.kjonn` postoji.
2. Ako da, prikazati dodatni badge pored word type badge-a sa vrednošću `grammarForms.kjonn` (npr. "en", "ei", "et").
3. Stilizovati kao mali tag sličan word type badge-u ali sa drugom bojom (npr. `bg-yellow-500/15 text-yellow-700`).

Primer prikaza: `[imenica] [en]` pored reči.

