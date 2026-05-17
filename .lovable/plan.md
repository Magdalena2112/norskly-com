# Replace "norsk." card with motivational editorial quote

## Scope
Only `src/pages/LandingPage.tsx`, lines 465–469 (the decorative square card in the FAQ section). No new components, no new data, no route changes.

## New card design

Keep the same wrapper position and aspect (square, `max-w-md`, pastel pink `bg-secondary`, soft dotted texture, rounded-3xl, subtle border). Replace the centered `norsk.` script with an editorial-style motivational quote.

### Content
- Eyebrow (small, uppercase, tracked): `Norskly note`
- Main quote, oversized editorial typography, mixed display + script:
  - Line 1: `Confidence` (display serif, ultra-large)
  - Line 2: `comes with` (display serif, slightly smaller)
  - Line 3: `practice.` (script italic, primary color, oversized for emphasis)
- Bottom-left signature mark: small `— norsk.` in script, low opacity

### Layout
- Replace the centered absolute `flex items-center justify-center` with a padded inner layout: `absolute inset-0 p-8 md:p-10 flex flex-col justify-between text-left`.
- Quote block top-left; signature bottom-left; small decorative element top-right.

### Typography
- Eyebrow: `text-xs font-semibold uppercase tracking-widest text-primary/60`
- Quote container: `text-display text-primary leading-[0.95]`
  - Line 1: `text-[clamp(2.25rem,6vw,4.5rem)]`
  - Line 2: `text-[clamp(2rem,5.5vw,4rem)] text-primary/85`
  - Line 3 (script): `font-script not-italic text-primary text-[clamp(2.75rem,7vw,5.5rem)] block mt-1`
- Signature: `font-script text-primary/50 text-xl`

### Subtle decorative elements
- Keep existing `bg-dots-soft` on the wrapper.
- Add a small top-right accent: a tiny `Sparkles` icon (already imported from lucide-react in this file — verify; if not, add to existing lucide-react import) at `text-primary/40 w-5 h-5`.
- Add a thin horizontal divider (`h-px w-12 bg-primary/30`) between the quote block and the signature for editorial rhythm.

### Accessibility
- Wrap the quote in a `<blockquote>` with `<cite>` for the signature.

## Out of scope
- FAQ list, headings, surrounding section spacing — unchanged.
- No color token changes; reuse existing `secondary`, `primary`, `border`.
