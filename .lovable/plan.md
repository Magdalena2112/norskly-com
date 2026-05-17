
## Goal
Transform the hero of `ForTeachersPage` into a split layout: existing editorial copy on the left, the uploaded AI teacher avatar on the right with a subtle looping wave + idle float animation.

## Steps

1. **Add avatar asset**
   - Copy `user-uploads://Gemini_Generated_Image_bgniuobgniuobgni.png` to `src/assets/teacher-avatar.png`.
   - Import it as an ES6 module in `ForTeachersPage.tsx`.

2. **New component `TeacherAvatar.tsx`** (in `src/components/`)
   - Renders the avatar with a CSS mask / clip approach to isolate the right hand region so only the hand waves, while the body remains still — implemented as two stacked layered images:
     - **Base layer**: full avatar with the hand area masked out via `mask-image` (radial gradient hiding the hand zone) — keeps body perfectly still.
     - **Hand layer**: same image, masked to *only* show the right-hand region, with `transform-origin` set near the wrist and animated rotation.
   - Wave animation: framer-motion keyframes `rotate: [0, -12, 8, -10, 6, 0]` over ~1.8s, then pause ~3s, looping (`repeat: Infinity, repeatDelay: 3, ease: "easeInOut"`).
   - Idle float on the whole avatar container: `y: [0, -8, 0]` over 5s, infinite easeInOut.
   - Soft glow: blurred radial accent behind avatar using `bg-primary/10` and `bg-accent/10` blobs for depth, matching existing hero ambient lights.
   - Respects `prefers-reduced-motion` (motion-reduce variant disables animation, shows static avatar).

3. **Update hero layout in `ForTeachersPage.tsx`**
   - Change the hero container to a 2-column grid at `md`+ (`grid md:grid-cols-2 gap-12 items-center`).
   - Left column: existing back link, H1, subtitle, CTA, trust line — left-aligned on `md+`, centered on mobile.
   - Right column: `<TeacherAvatar />`, hidden on `sm` only if needed (keep visible on mobile but scaled down — placed below the text via grid order).
   - Keep `max-w-5xl` → bump to `max-w-6xl` for breathing room.
   - Preserve cream background, gradient blobs, typography, font-script accent, and existing CTA styles.

4. **Visual polish**
   - Avatar wrapped in a soft circular ambient halo (`absolute -inset-8 bg-gradient-to-br from-primary/15 to-accent/15 rounded-full blur-3xl`).
   - Optional small floating "Hei!" speech bubble near the waving hand using existing card style + `motion-reduce:hidden`, fading in/out synced with the wave (`animate={{ opacity: [0,1,1,0] }}`, same `repeatDelay`).

## Technical notes
- No backend/RLS changes.
- Only edits: `src/pages/ForTeachersPage.tsx`, new `src/components/TeacherAvatar.tsx`, new asset in `src/assets/`.
- Uses existing `framer-motion` dependency. No new packages.
- All colors via semantic tokens (`primary`, `accent`, `foreground`).
