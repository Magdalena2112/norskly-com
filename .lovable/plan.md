## Cilj

U sekciji "Ekosistem" (`#teachers`) dodati suptilnu pozadinsku ilustraciju inspirisanu priloženom slikom (kolaž profila glava sa šarama), ali u **warm editorial** paleti stranice — krem pozadina, duboka burgundy/plum, pastelna roze, sage zelena, blagi peach/terracotta akcenti. Bez fokusa na bilo koji konkretan jezik.

## Izmena

1. **Generisanje slike** (`imagegen--generate_image`, premium):
   - Prompt: kolaž ljudskih siluetnih profila — različitih veličina i orijentacija, layered/overlapping, sa apstraktnim šarama (tačkice, talasi, mreže, kratke linije). Bez teksta i bez bilo kakvih zastava/jezičkih oznaka.
   - Paleta: krem, duboka plum/burgundy, pastel roze, sage zelena, blagi terracotta — usklađeno sa postojećim warm editorial tokenima.
   - Stil: editorial collage / cut-paper, papirna tekstura, smireno i sofisticirano (ne kičasto). Dobar kontrast u glavnim oblicima ali sa "vazduhom" oko ivica, pogodno za pozadinu.
   - Format: `src/assets/ecosystem-collage.jpg`, široki format (1920×1024).

2. **Integracija** u `src/pages/LandingPage.tsx`, u sekciji `<section id="teachers">`:
   - Import slike na vrhu fajla.
   - Sekcija dobija `relative overflow-hidden`.
   - Dodati apsolutno pozicioniran `<div>` sa `background-image` (cover, center) iza sadržaja:
     - `opacity` ~18–22% da bude suptilno.
     - Soft mask: `[mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_90%)]` za blagi vignette.
     - Iznad slike dodatni overlay `bg-background/55` za čitljivost.
   - `container` postaviti na `relative z-10`.

3. Bez promene sadržaja kartica ili kopija.

## Šta NIJE u opsegu

- Promena boja same sekcije, kartica ili tipografije.
- Animacije pozadine ili parallax.