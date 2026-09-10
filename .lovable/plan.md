# Plan: Redirect `/home` → `/`

## Current situation
The live production site `https://norskly.com/` is deployed on Lovable hosting. The previous homepage path `/home` is still indexed by Google but is no longer used.

## Platform limitation
Lovable hosting does **not** support server/deployment-level HTTP 301 redirects or redirect configuration files such as `_redirects`, `netlify.toml`, or `vercel.json`. Lovable's hosting is built around SPA fallback routing, so only client-side/React Router navigation is natively available.

## What this means for SEO
A client-side redirect alone sends an HTTP 200 OK for `/home` and only changes the URL via JavaScript. Search engines may eventually follow it, but it is weaker than a real 301 for passing link equity and removing the old URL from the index.

## Options to proceed

### Option A: Client-side redirect with SEO helpers (recommended within Lovable constraints)
Add a `/home` route that:
1. Returns a proper React Router `<Navigate to="/" replace />` so users land on `/`.
2. Injects a `<link rel="canonical" href="https://norskly.com/" />` and `<meta name="robots" content="noindex, follow" />` via `react-helmet-async` on `/home`.
3. Keeps `/home` out of `sitemap.xml` (it already is not listed).

This is the best available solution while staying on Lovable hosting, but it is **not** a true 301.

### Option B: True 301 via external CDN/proxy (requires leaving Lovable hosting for redirects)
If a real 301 is mandatory, the redirect must be configured outside Lovable, for example:
- Cloudflare Page Rules / Redirect Rules on `norskly.com`
- A reverse proxy in front of the Lovable deployment
- Vercel/Netlify/etc. with `vercel.json` / `_redirects`

This is outside the Lovable project code and would need to be done in DNS/CDN settings, not in this repository.

### Option C: Do nothing
Leave `/home` returning the app/404 and let Google naturally re-index `/` through canonical tags and sitemap priorities.

## Proposed implementation
If you approve **Option A**, I will:
1. Add a `/home` route in `src/App.tsx` that renders a redirect component.
2. Create a small `HomeRedirect` component that:
   - Performs the client-side navigation to `/`.
   - Renders the canonical/noindex meta tags for `/home`.
3. Verify the build still passes and that `/home` is not in the sitemap (it is not currently).
4. Confirm the expected behavior: `/home` returns HTTP 200 from the server, then the browser navigates to `/` client-side; the canonical tag points to `/`.

I will not change any other routes, page content, design, SEO metadata for other pages, sitemap, robots.txt, or prerendering.

## Decision needed
Please confirm which option you want. If you require a true HTTP 301 status, that cannot be done from within the Lovable project and would need external CDN/DNS configuration.