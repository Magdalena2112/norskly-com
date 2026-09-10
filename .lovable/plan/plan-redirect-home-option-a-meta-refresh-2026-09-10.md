# Plan: Redirect `/home` → `/` (Option A — meta refresh)

## Goal
Handle the old public URL `/home` by serving an initial HTML page that instantly redirects to `/` using a `<meta http-equiv="refresh">`, without relying only on JavaScript.

## Platform reality
Lovable hosting does not support true HTTP 301 redirects, `_redirects`, `netlify.toml`, or `vercel.json`. The only mechanisms available are static HTML files and client-side React Router navigation.

## Implementation
1. Extend `seo/prerender.ts`
   - Add a small helper that writes a dedicated `dist/home/index.html` during `closeBundle()`.
   - That file will contain the full base `index.html` shell with these tags injected into `<head>`:
     - `<meta http-equiv="refresh" content="0; url=https://norskly.com/">`
     - `<link rel="canonical" href="https://norskly.com/">`
   - The body will show a short visible message with a normal link to `/` as a fallback.
   - Keep `/home` **out** of `SEO_ROUTES` and out of `public/sitemap.xml`.

2. Add `/home` React Router fallback in `src/App.tsx`
   - Add `<Route path="/home" element={<HomeRedirect />} />`.
   - Create `src/components/HomeRedirect.tsx` that renders a fallback message/link and, as a secondary safety net, navigates to `/` after mount.
   - Do not add `<meta name="robots" content="noindex">`; the meta refresh + canonical are the intended signals.

3. Verify
   - `bun run build` passes and produces `dist/home/index.html` with the meta refresh and canonical.
   - `/home` is not present in `public/sitemap.xml` or `scripts/generate-sitemap.ts`.
   - No other public/private page content, SEO metadata, sitemap, robots.txt, prerendering, design, or functionality is changed.

## Expected behavior
- Browser request to `https://norskly.com/home` returns HTTP 200 and serves `dist/home/index.html`.
- The browser reads `<meta http-equiv="refresh" content="0; url=https://norskly.com/">` and immediately navigates to `/`.
- Users without JavaScript still see a clickable link to `/`.
- Search engines see the instant redirect and the canonical tag pointing to `/`.
- React Router navigation is present only as an extra client-side fallback.

## What this is not
This is **not** a true server-level HTTP 301 redirect. The initial response for `/home` will still be HTTP 200 OK. A real 301 would require external CDN/DNS configuration outside Lovable.