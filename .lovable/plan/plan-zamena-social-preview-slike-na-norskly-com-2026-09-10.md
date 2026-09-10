# Plan: Zamena social preview slike na norskly.com

## Goal
Promeniti sliku koja se prikazuje kada neko podeli link ka sajtu (Open Graph / Twitter preview image), tako da odgovara trenutnom brendu i porukama.

## Implementation
1. **Generate a new social preview image**
   - Dimenzije: 1200×630 px (preporučeno za Facebook/LinkedIn/X preview).
   - Format: WebP, optimizovano za web, cilj ispod 200 KB.
   - Stil: Norskly estetika — nordijski minimalizam, Aurora gradijenti (navy, turquoise, green, purple), glassmorphism elementi, bez suvišnog teksta ili samo sa diskretnim brendingom.
   - Sačuvati kao `public/social-preview.webp`.

2. **Update `index.html`**
   - Zameniti `og:image` i `twitter:image` da pokazuju na apsolutni URL:
     ```
     https://norskly.com/social-preview.webp
     ```
   - Ostali meta tagovi (title, description, og:title, og:description, canonical, JSON-LD, verifikacija) ostaju nepromenjeni.

3. **Verify build output**
   - Pokrenuti `bun run build`.
   - Proveriti da `dist/index.html` sadrži novi `og:image` URL.
   - Uveriti se da prerender i ostale rute nisu dirane.

4. **Publish**
   - Objaviti sajt kako bi promena postala vidljiva na `https://norskly.com`.
   - Nakon objavljivanja, slika se propagira na društvene mreže kako one ponovo skeniraju link.

## What will not change
- Dizajn, layout, boje, tipografija i funkcionalnost sajta.
- SEO title/description/structured data, osim same slike.
- Sitemap, robots.txt, prerendering, routing.
- Sadržaj na landing page, language page, teacher page i drugim stranicama.

## Technical details
- `og:image` mora biti apsolutan `https://` URL kako bi ga crawleri ispravno pročitali.
- Trenutno se slika definiše samo u `index.html`; per-route Helmet blokovi ne postavljaju sopstvenu `og:image`, pa se nasleđuje ova vrednost.
- Nova slika će se servirati statički iz `public/`, pa nije potrebna nikakva backend promena.
