# Redesign homepage pricing → informational onboarding section

## Goal
Replace the checkout-style pricing block on `LandingPage.tsx` with an informational, onboarding-focused section. Real plan selection stays on `/jezici/:slug`.

## Scope
Only `src/pages/LandingPage.tsx`. No new components, no route or data changes.

## Changes

### 1. Section header
- Section id stays `pricing` (nav link `#pricing` still works), but visually labeled as "Kako učiš na Norskly?".
- Eyebrow: `Fleksibilno učenje` (replaces "Cene za studente").
- Title: `Uči svojim` <span script>tempom</span>. (replaces "Izaberi svoj plan.")
- Subtitle: `Istraži kako Norskly funkcioniše i koje opcije učenja te čekaju.`
- Remove "7 dana besplatno" pill at top (the free-trial block below already communicates it).

### 2. Free trial block — reframe as onboarding intro
- Add a heading inside the card:
  - Title: `Započni besplatno.`
  - Subtitle: `Istraži platformu i upoznaj način učenja pre izbora pretplate.`
- Keep two-column layout: `TRIAL_INCLUDED` (gramatika, vokabular, probna rezervacija, upoznavanje) on the left, `TRIAL_LOCKED` on the right with Lock icons — visually separated as today.
- Remove the "Bez kartice" microcopy chip / keep it subtle in the heading area.
- No CTA button in this card (informational only).

### 3. Replace 2 pricing cards with 2 informational cards
Drop the `PRICING` constant. New `LEARNING_OPTIONS` array, rendered in the same `md:grid-cols-2` layout but without:
- price block
- "Preporučeno" badge
- featured/primary background treatment
- purchase Button

Both cards: equal weight, `bg-background border border-border rounded-3xl`, soft hover shadow, burgundy accent icon at top.

Card 1
- Icon: `Sparkles` (or `Bot`) in pastel pink circle
- Title: `Samostalno AI učenje`
- Description: `Za učenike koji žele potpuno samostalno učenje uz AI podršku.`
- Features (Check list):
  - AI razgovori
  - Personalizovane vežbe
  - Gramatika i vokabular
  - Praćenje napretka

Card 2
- Icon: `GraduationCap` in pastel pink circle
- Title: `AI + podrška profesora`
- Description: `Kombinuj AI alate sa individualnim časovima i podrškom profesora.`
- Features:
  - Rezervacija časova
  - Podrška profesora
  - AI alati tokom učenja
  - Praćenje napretka

### 4. Soft bottom CTA
Below the two cards, centered:
- Copy: `Izaberi jezik da vidiš dostupne profesore i opcije učenja.`
- Button (outline/ghost, rounded-full): `Izaberi jezik` → scrolls to the language selection in the hero (existing `#languages` anchor, or `document.getElementById('languages')?.scrollIntoView({behavior:'smooth'})` — confirm hero section id while implementing and reuse or add it).

## Notes
- Keep current visual language: cream background (`bg-card/60`), burgundy primary, pastel pink accents, `rounded-3xl`, `shadow-card-soft`, editorial display/script typography mix.
- Remove the unused `PRICING` constant and any imports that become unused (e.g. ArrowRight if no longer needed there — verify).
- Nav "Cene" link: rename label to `Kako učiš` pointing to `#pricing` so the anchor keeps working without route churn.
