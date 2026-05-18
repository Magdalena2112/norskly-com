## Cilj
Učiniti `LandingPage` preglednom na malim ekranima (≤390px), bez menjanja sadržaja ili dezajn-tokena.

## Promene (samo `src/pages/LandingPage.tsx`)

1. **Nav (linija 117–134)**
   - Smanjiti logo na mobilnom (`text-xl md:text-2xl`).
   - Sakriti dugme "Prijava" na vrlo malim ekranima (`hidden xs:inline-flex` ili `sm:`), ostaviti samo "Započni besplatno" kao kompaktni CTA.
   - Smanjiti padding kontejnera i visinu navigacije po potrebi.

2. **Hero (137–183)**
   - Smanjiti top/bottom padding na mobilnom (`pt-24 pb-12`).
   - Smanjiti H1 fluid clamp donju granicu (npr. `clamp(2rem, 9vw, 7rem)`) da ne prelama jako.
   - Jezik pilule: manje padding/gap na mobilnom (`px-5 py-3 text-sm gap-2`).
   - Smanjiti dekorativne blur krugove na mobilnom.

3. **Features grid (186–216)**
   - Padding sekcije `py-14 md:py-28`.
   - Kartice `p-5 sm:p-8`, naslov `text-xl sm:text-2xl`.

4. **Marquee (219–231)**
   - Smanjiti veličinu teksta na mobilnom (`text-2xl md:text-4xl`) i razmak.

5. **Studenti vs Profesori (234–298)**
   - Kartice `p-6 md:p-10`, naslov `text-3xl md:text-4xl`.
   - Smanjiti opacity collage još malo na mobilnom da tekst ostane čitljiv.

6. **Role choice (301–326)**
   - Kartice `p-6 sm:p-10`, naslovi `text-4xl sm:text-5xl`.

7. **"Da li je Norskly pravi?" (329–360)**
   - Kartice `p-6 md:p-8`.
   - `FloatingQuestionMarks` već adaptivan — bez izmena.

8. **How it works (363–460)**
   - Trial kartica padding `p-6 md:p-10`, gridovi gap manji.
   - CTA dugme `h-11 px-5` na mobilnom.

9. **FAQ (463–505)**
   - Quote card aspect-square zameniti sa `aspect-[4/3] md:aspect-square` ili sakriti na vrlo malim ekranima (`hidden sm:block`) da ne zauzima ceo viewport.
   - Smanjiti gap između kolona (`gap-8 md:gap-12`).

10. **Final CTA (508–530)**
    - Padding `p-8 md:p-20`, rounded `rounded-3xl md:rounded-[2.5rem]`.
    - Naslov clamp donja granica `1.8rem`.

11. **Footer (533–538)**
    - Manji vertikalni razmak na mobilnom, centriran.

## Van obima
- Bez izmena na `FloatingQuestionMarks`, `FloatingGreetings`, design tokenima, ili sadržaju.
- Bez promene logike, ruta ili podataka.
