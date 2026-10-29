## Novi Norskly logo na celoj platformi

1. Ukloniti svetlu pozadinu sa poslatog loga: ostaje samo zeleni oblačić sa natpisom NORSKLY, na providnoj pozadini, bez promene oblika, slova i boja.
2. Proveriti da ivice i roze obrub slova ostanu čisti na svetloj i tamnoj podlozi.
3. Zameniti postojeći logo svuda gde se pojavljuje: početna strana, prijava, izbor jezika/kursa (i sva mesta koja koriste isti logo).
4. Napraviti od istog loga ikonicu sajta u pretraživaču i ikonice za telefon (početni ekran).
5. Proveriti izgled na računaru i na mobilnom (veličina, da logo nije razvučen).

### Tehnički detalji
- Uklanjanje pozadine programski (flood-fill bele/krem pozadine), pa izrezivanje na sadržaj; izlaz WebP + PNG preko lovable-assets, zamena `norskly-logo.webp.asset.json` importa.
- `public/favicon.png`, `favicon-192/512.png`, `apple-touch-icon.png` regenerisati (kvadrat sa paddingom).
