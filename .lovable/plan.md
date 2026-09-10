# Plan: Redirect `/home` → `/` (Option A)

## Goal
Handle the old public URL `/home` by sending users and search engines to `/` using the best available mechanism within Lovable hosting constraints.

## Platform reality
Lovable hosting does not support true HTTP 301 redirects, `_redirects`, `netlify.toml`, or `vercel.json`. The only native redirect mechanism is client-side React Router navigation.

## Implementation
1. Create `src/components/HomeRedirect.tsx`
   - Use `useEffect` + `useNavigate` to redirect to `/` immediately.
   - Render `<Helmet>` with:
     - `<link rel="canonical" href="https://norskly.com/" />`
     - `<meta name="robots" content="noindex, follow" />`
   - Render a small visible message so non-JS users still see a link to `/`.

2. Register `/home` route in `src/App.tsx`
   - Add `<Route path="/home" element={<HomeRedirect />} />` near the public routes.
   - Do not change any other route.

3. Verify
   - `bun run build` passes.
   - `/home` remains absent from `public/sitemap.xml` and is not added.
   - No other public/private page content, SEO metadata, sitemap, robots.txt, prerendering, design, or functionality is changed.

## Expected behavior
- Browser request to `https://norskly.com/home` returns HTTP 200 and loads `index.html` (SPA fallback).
- JavaScript immediately navigates to `/` and replaces history.
- Search engines see `<link rel="canonical" href="https://norskly.com/" />` and `<meta name="robots" content="noindex, follow" />` on `/home`, signaling the canonical URL is `/` and the page should not be indexed.

## What this is not
This is **not** a true server-level 301 redirect. The initial HTTP response for `/home` will be 200 OK. A real 301 would require external CDN/DNS configuration outside Lovable.