# Onboarding & Navigation Redesign

Restructure the user journey so language selection becomes step 1, each language has its own premium landing page (hero + teachers + plans), and registration leads into a clean stepped onboarding ending in a free trial.

## 1. Routing changes (`src/App.tsx`)

Add three new routes pointing to a single dynamic component:
- `/jezici/norveski`
- `/jezici/engleski`
- `/jezici/nemacki`

Implemented as `/jezici/:slug` → `LanguagePage.tsx`, with a lookup table mapping slug → language config (name, native title, hero copy, color accent, available flag).

Only Norwegian is "available" initially; English/German render the same layout with a "Uskoro" badge and disabled CTAs (keeps scope tight, preserves the structure for later).

## 2. Homepage language buttons (`src/pages/LandingPage.tsx`)

Convert the existing static language buttons into `<Link>`s to the three new routes. Keep current styling (cream bg, burgundy accents, pastel pink). Add a subtle hover lift.

## 3. New `LanguagePage.tsx`

Premium editorial layout, sections in order:

1. **Hero** — language-specific Serbian headline (e.g. "Uči norveški uz AI i podršku profesora."), short subtitle, primary CTA "Započni besplatno" → `/auth?lang=<slug>&plan=trial`, secondary CTA "Pogledaj planove" scrolling to plans.
2. **Teachers** — for Norwegian, fetch from existing `teacher_profiles` table (reuse pattern from `TeacherProfilePage`). Card grid: photo, name, short bio, lesson types (badges), price, rating placeholder (★ 5.0 · novo), CTA "Rezerviši čas" → `/auth?next=/book-lesson`. For unavailable languages, show 3 placeholder cards with "Uskoro" overlay.
3. **Plans** — three-card pricing section:
   - **7-day free trial** — highlighted, "Probaj besplatno"
   - **Self-Learning** — monthly price, AI modules only
   - **Learning + Lessons** — monthly price, AI + live lessons
   Each card: name, price, feature list, CTA → `/auth?plan=<id>&lang=<slug>`.
4. **Registration CTA** — full-width band, single CTA "Kreiraj nalog i počni" → `/auth?lang=<slug>`.

Styling: reuse existing tokens (warm cream bg, burgundy primary, accent pinks, rounded-2xl cards, subtle shadows, framer-motion fade-in-up on scroll).

## 4. Onboarding flow updates (`src/pages/OnboardingPage.tsx`)

Add a **stepper header** showing the full journey:
```
1 Jezik  →  2 Istraži  →  3 Nalog  →  4 Probna verzija  →  5 Učenje
```
Current step (post-registration) = "Probna verzija / Profil". The existing in-component steps (name, level, goal, etc.) become sub-steps under the "Profil" macro-step. The left-rail sidebar keeps its existing detailed step list, but a new horizontal macro-stepper sits above it/the content showing the 5-stage journey with the current stage highlighted.

On completion, redirect remains `/practice` but with a one-time "Tvoj 7-dnevni probni period je počeo" toast.

Read `?lang=<slug>` and `?plan=<id>` from the URL on mount and persist into the profile as `preferred_language` (string) and `selected_plan` (string) — stored only in localStorage for now (no DB migration this iteration; can be promoted later).

## 5. Auth page passthrough (`src/pages/AuthPage.tsx`)

Preserve `?lang` and `?plan` query params through the signup→onboarding redirect so the onboarding macro-stepper can show the correct context.

## Technical notes

- New files: `src/pages/LanguagePage.tsx`, `src/components/onboarding/JourneyStepper.tsx`, `src/lib/languages.ts` (slug→config map).
- Reuse: `Button`, `Card`, existing motion patterns, `BackButton`.
- No database migration needed for this iteration.
- Mobile: stack hero/teachers/plans vertically, horizontal scroll for stepper on <640px (per project mobile-responsiveness memory).
- All UI copy in Serbian (Latin); Norwegian-only where it's learning material.

## Out of scope (call out for follow-up)

- Real Stripe/Paddle payment wiring for plans (CTAs route to auth+trial only).
- Teacher availability for English/German (placeholder until teachers onboarded).
- Persisting `preferred_language` / `selected_plan` to `profiles` table.
