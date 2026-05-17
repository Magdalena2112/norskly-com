
## Norskly Homepage Redesign — Plan

A full visual + structural redesign of `src/pages/LandingPage.tsx`, repositioning Norskly from a Norwegian-only school into a premium, multilingual, AI-powered language learning ecosystem for students and teachers. Inspired (not copied) by the Hot Core Pilates editorial aesthetic.

### 1. Design System Updates

Update `src/index.css` and `tailwind.config.ts` with a warm editorial palette as HSL semantic tokens:

- `--background`: cream / off-white
- `--card` / `--muted`: soft beige
- `--accent`: pastel pink
- `--primary`: deep burgundy / plum
- `--secondary`: muted sage green
- Add `--shadow-soft`, `--shadow-card` design tokens
- Add two display fonts via Google Fonts:
  - Bold condensed display (e.g. Fraunces or Bricolage Grotesque) for oversized headlines
  - Italic script accent (e.g. Caveat Brush / Instrument Serif italic) for the "the / for / of" connector words seen in references
- Body remains Inter
- Add utilities: `text-display`, `text-script`, oversized fluid type scale (`clamp(...)`)
- Subtle grid background utility for hero

All colors must stay HSL semantic tokens — no hardcoded hex in components.

### 2. New Landing Page Sections (single page, top → bottom)

1. **Sticky Nav** — Norskly wordmark, links (Platform, For Teachers, Pricing, FAQ), language pill switcher, Login, "Start free" primary CTA.
2. **Hero**
   - Oversized split headline using script italic accent word
   - Subtitle (1–2 lines, multilingual positioning)
   - Language pill selector: 🇳🇴 Norwegian, 🇬🇧 English, 🇩🇪 German (active state styled in burgundy)
   - Two CTAs: `I am a Student` (primary burgundy) / `I am a Teacher` (outline)
   - Soft grid / dotted background, decorative pastel blobs
3. **Feature Grid** — 6 large rounded cards (2×3 on desktop, 1 col mobile) with icon, title, description for: Real-life Communication, Personalized Learning, Grammar in Context, Instant AI Feedback, AI Conversation Practice, Smart Progress Tracking.
4. **Students vs Teachers Split Section** — editorial 2-column split, each side a stacked card stack with bullet list and CTA. Beige card for Students, pink card for Teachers.
5. **Role Selection Teaser ("Choose your role")** — two oversized cards [Student] / [Teacher] linking into `/auth` with role pre-selected via query param.
6. **"Is Norskly right for me?"** — two side-by-side editorial cards (beige check-list, pink x-list) mirroring the reference layout.
7. **Pricing / Membership** — 3 modern pricing cards: Self-learning, Lessons + Platform, Teacher Access. Middle card highlighted ("Most popular") in burgundy.
8. **FAQ Split** — accordion left, soft illustration / image right (use existing `heroBg` or a new asset).
9. **Marquee CTA strip** — repeating "START LEARNING \ START TEACHING \" ticker in burgundy.
10. **Final CTA + Footer** — large editorial CTA card + minimal footer.

### 3. Components Created

Kept inside `src/pages/LandingPage.tsx` initially; extract only if they grow:
- `LanguagePills` (controlled state, no routing impact yet — purely visual selector)
- `FeatureCard`, `RoleCard`, `PricingCard`, `ChecklistCard`
- `FaqAccordion` (uses existing shadcn `accordion`)
- `MarqueeStrip` (CSS keyframes)

### 4. Routing / Behavior

- Language pills: local state only (no i18n yet) — UI affirms multilingual positioning. Default = Norwegian.
- Role CTAs: navigate to `/auth?role=student` and `/auth?role=teacher`. `AuthPage` already exists; reading the param is out of scope unless trivially additive (note: no auth-flow logic changes in this pass).
- All copy in Serbian (Latin) per project localization policy; brand/feature names may stay in English where natural.

### 5. Responsive & Motion

- Fluid type via `clamp()`; oversized headers collapse gracefully on 390px.
- Grid columns: 1 → 2 → 3 at `md` / `lg`.
- Framer Motion (already in project) for subtle fade/slide-in on scroll, hover lift on cards (`hover:-translate-y-1`, soft shadow).
- Respect `prefers-reduced-motion`.

### 6. Out of Scope (explicit)

- No backend, auth, RLS, or edge function changes.
- No real i18n implementation — language switcher is visual only.
- No new pricing logic / Paddle wiring.
- No changes to `DashboardPage`, admin, or learning modules.

### Files Touched

- `src/index.css` — palette + fonts + utilities
- `tailwind.config.ts` — font family + token extensions
- `src/pages/LandingPage.tsx` — full rewrite
- (optional) `src/assets/` — 1 new soft editorial image if existing `hero-bg.jpg` doesn't fit the warm palette

### Acceptance

- Matches reference mood: editorial, warm, oversized type, rounded cards, pastel accents, deep burgundy.
- All 10 sections present and responsive at 390 / 768 / 1280.
- Language pills, role CTAs, FAQ accordion all interactive.
- No hardcoded colors; only semantic tokens.
- Copy in Serbian Latin, multilingual positioning (not Norwegian-only).
