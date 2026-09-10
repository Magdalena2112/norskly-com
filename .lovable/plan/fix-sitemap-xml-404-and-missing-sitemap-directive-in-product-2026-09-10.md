# Fix sitemap.xml 404 and missing Sitemap directive in production

## Diagnosis (verified)

- Local `public/sitemap.xml` exists and contains exactly the 5 public URLs.
- Local `public/robots.txt` already contains `Sitemap: https://norskly.com/sitemap.xml`.
- Live `https://norskly.com/robots.txt` is the OLD version (no Sitemap line) and `https://norskly.com/sitemap.xml` returns 404.

**Cause:** the running production deployment was built from a version before the sitemap/robots changes — the current files were never actually deployed to production. The local code is correct; the live site is stale. (The build-time generator only wrote the file in the sandbox; what matters is that the committed static file ends up in the deployed `dist/`, which requires a fresh publish.)

## Fix (simplest, most reliable)

1. Keep a **committed static** `public/sitemap.xml` (already present, exactly the 5 URLs: `/`, `/jezici/norveski`, `/jezici/engleski`, `/jezici/nemacki`, `/za-profesore`; no private routes, no `/auth`, no `/home`). Vite copies `public/` into `dist/` on every build, so no build-time step is required for the file to deploy.
2. Keep the `prebuild`/`predev` generator script — its output is byte-identical to the committed file, so it is harmless and keeps the two in sync.
3. Keep `public/robots.txt` as-is (already has the `Sitemap:` directive and all existing user-agent blocks).
4. **Publish the project** so the current `public/` files reach production.
5. Verify after publish with live requests:
   - `https://norskly.com/sitemap.xml` returns 200 with XML content (not the app 404 page)
   - `https://norskly.com/robots.txt` contains `Sitemap: https://norskly.com/sitemap.xml`
6. Mark SEO finding `http:sitemap` fixed only after both live checks pass.

## Not changed

- No design, functionality, SEO metadata, canonical tags, prerendering setup, or route content.
- No other security/SEO findings touched.
