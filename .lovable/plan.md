

## Plan: Extend Hero Image to Full Page Background

### What
Move the hero background image from the hero `<section>` to the top-level `<div>` so it covers the entire landing page.

### How

**File: `src/pages/LandingPage.tsx`**

1. Move the background image markup (the `<img>` and gradient overlay) from inside the hero `<section>` (around lines 73-77) to just inside the root `<div>` (after line 70), making it a fixed/absolute full-page background.

2. Update the root `<div>` to have `relative` positioning so the background sits behind all sections.

3. Remove the `relative` and `overflow-hidden` from the hero `<section>` since the image is no longer scoped to it.

4. Adjust the gradient overlay to be more subtle across the full page, ensuring readability for features, CTA, and footer sections.

5. Update `bg-nordic-warm` on the features section and other section backgrounds to be semi-transparent (e.g., `bg-background/60 backdrop-blur-sm`) so the image shows through.

