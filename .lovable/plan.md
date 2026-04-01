

## Plan: Northern Lights Background for Dashboard

### What
Replace the solid `bg-[#d3e2e9]/[0.64]` background on the dashboard with an animated aurora borealis-inspired gradient.

### How

**File: `src/pages/DashboardPage.tsx` (line 103)**
- Replace the static background class with a CSS gradient that blends deep navy, teal, green, and subtle purple — classic aurora colors
- Use a subtle animated gradient shift via CSS keyframes for a living aurora feel

**File: `src/index.css`**
- Add a `@keyframes aurora` animation that slowly shifts a large gradient background position
- Add a `.bg-aurora` utility class combining the multi-stop gradient with the animation
- Keep colors muted/pastel to maintain readability and the Nordic aesthetic

**Color palette:**
- Deep navy base: `#0f1b2d`
- Teal/cyan: `#1a3a4a`, `#2d6a6a`  
- Aurora green: `#3a8a6a`, `#4aaa7a`
- Subtle purple: `#2a2a5a`
- All blended softly with low opacity overlays to keep text readable

**Readability:** A semi-transparent warm overlay will sit beneath content to ensure card contrast remains intact.

