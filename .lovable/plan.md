
# Dashboard inspired by Lofoten sunsets & Norwegian postcards

Use the two reference images as the visual soul:
1. **Lofoten sunset** → atmosphere, palette, mood (peach / lilac sky, slate mountains, red rorbuer cabins, mirror-calm fjord)
2. **Sticker collage** → composition language (hand-illustrated stickers, watercolor postcards, vintage stamps, script labels, gentle rotations)

The current dashboard already moved to cream + burgundy + fjord silhouettes. This plan deepens the atmosphere and adds the postcard/sticker character.

---

## 1. Hero band — "a window onto the fjord"

Replace the plain greeting block with a wide hero card sitting above XP:

- Rounded `rounded-3xl` container, cream paper background, thin burgundy border, `shadow-postcard`.
- Inside, a **left text column** (greeting "Hei, {name}", script subtitle "Velkommen tilbake til fjordene", short Serbian intro) and a **right illustrated panel** that mimics the Lofoten photo using pure SVG/CSS — no raster images required:
  - peach→lilac gradient sky
  - layered slate mountain silhouettes (3 ridges, parallax depth)
  - mirrored water with a subtle reflection band
  - 3–4 tiny rorbuer (red/ochre house shapes) along the shore
  - one small sailboat dot
- Above the panel, a torn-paper / washi-tape strip (CSS pseudo-element) so it reads as a pinned postcard.
- Hidden below `md` (mobile gets text + a compact mountain strip only).

## 2. Module cards as postcards

Restyle the four module cards to feel like the collage stickers:

- Each card becomes a **postcard**: cream body, thin border, slight individual rotation (`-rotate-1`, `rotate-[0.5deg]`, etc., reset to 0 on hover), `shadow-postcard`, hover lifts and straightens.
- Top half of each card: a tiny watercolor-style SVG vignette themed to the module:
  - Gramatika → open book + ink swirl on a soft pink wash
  - Vokabular → stylised stamp ("ORD · 45 KR") on peach wash
  - Razgovor → speech bubble with "Hei!" on fjord-blue wash
  - Razgovor sa profesorom (full width) → a wider scene of cabins + mountain on sunset wash, with a teacher avatar chip
- Bottom half: script subtitle (Norwegian), serif title (Serbian), one-line description, optional CTA.
- A small **dashed-border "stamp" corner** (e.g. `27 KR NORGE`) tucked on one card for collage flavor.

## 3. Background atmosphere

Keep `NordicBackdrop` but evolve it:

- Replace the abstract fjord SVG with a softer, multi-layer ridge silhouette using the same slate/forest palette as the Lofoten photo, lowered opacity so it whispers behind content.
- Sky wash shifts from sunset peach (top) → dusty lilac → cream → mist blue near the ridges (matches photo's vertical gradient).
- Floating decorations become **postcard stickers** with script labels: "Lofoten", "Bergen", "Tromsø", "45 KR" stamp, "Hei!" / "Hvordan går det?" speech bubbles. Each with gentle 6s float, varied rotations, hidden progressively on smaller breakpoints so mobile stays clean.
- Add 2–3 tiny watercolor "ink dots" (radial gradients) as paper-texture accents.

## 4. XP & upcoming-lesson cards

- XP card: keep structure, but swap the gradient progress bar to **burgundy → sunset peach → fjord blue** (echoes sky-to-water), add a small dashed "stamp" frame around the level number to tie into the postcard motif.
- Upcoming lesson card: add a tiny SVG cabin icon in the corner; CTA color stays burgundy.

## 5. Typography polish

- Greeting H1: `text-display` (Fraunces 900) in burgundy, with a small `font-script` italic kicker above it ("Velkommen tilbake").
- Section divider before the cards already says "Læringsmoduler" in script — keep, but center a tiny ✦ glyph between the two hairlines.
- Body remains Inter; all Norwegian flourishes use Instrument Serif italic.

## 6. Motion (subtle only)

- Hero illustration: mountains do a 600ms ease-out fade/slide-in on mount; water reflection gently shimmers (3s ease-in-out infinite, opacity 0.6↔0.9).
- Module cards: rotation resets + 4px lift + shadow grow on hover, 300ms.
- Stickers: existing 6s float, varied delays.
- No parallax, no scroll-jank, no AI/futuristic glows.

## 7. Files to touch

```text
src/index.css                              # add sunset/lilac sky gradient utility, washi-tape, postcard rotation helpers
src/components/student/NordicBackdrop.tsx  # refine ridges, palette, sticker labels
src/components/student/FjordHero.tsx       # NEW — SVG Lofoten-style hero illustration
src/components/student/PostcardVignette.tsx# NEW — small per-module SVG vignettes
src/pages/DashboardPage.tsx                # wire hero, restyle module cards as postcards
src/components/XpProgressCard.tsx          # progress bar gradient + tiny stamp frame
```

No backend, no schema, no auth changes. UI/presentation only.

## What stays exactly as-is

- Sidebar (Profil / Napredak / Podešavanja), header chips, routes.
- The four modules and their destinations.
- WeeklyDigest widget.
- Serbian copy everywhere except the small Norwegian flourishes ("Hei", "Velkommen tilbake", "Læringsmoduler", postcard labels).

---

### One clarification before I build

Do you want the hero illustration to be **pure SVG** (matches the sticker/postcard collage style, infinitely crisp, free, lightweight) or should I generate a **watercolor Lofoten illustration as an actual image asset** (closer to the photo, but heavier and slightly less "editorial sticker")?

Default if you don't answer: **pure SVG postcard illustration** — it fits the collage reference better and keeps load time small.
