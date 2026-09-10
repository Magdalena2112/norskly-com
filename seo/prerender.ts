import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { SEO_ROUTES, SITE_URL, type RouteSeo } from "./routes";

const escapeAttr = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Rewrite the head of the built index.html with route-specific metadata. */
export function buildRouteHtml(baseHtml: string, route: RouteSeo): string {
  const url = SITE_URL + (route.path === "/" ? "/" : route.path);
  let html = baseHtml;

  // Drop existing mutable SEO tags so no duplicates remain.
  html = html
    .replace(/[ \t]*<title>[\s\S]*?<\/title>\s*\n?/i, "")
    .replace(/[ \t]*<meta\s+name="description"[^>]*>\s*\n?/gi, "")
    .replace(/[ \t]*<meta\s+property="og:(title|description|url)"[^>]*>\s*\n?/gi, "")
    .replace(/[ \t]*<meta\s+name="twitter:(title|description)"[^>]*>\s*\n?/gi, "")
    .replace(/[ \t]*<link\s+rel="canonical"[^>]*>\s*\n?/gi, "");

  const tags = [
    `<title>${escapeHtml(route.title)}</title>`,
    `<meta name="description" content="${escapeAttr(route.description)}" data-rh="true">`,
    `<link rel="canonical" href="${escapeAttr(url)}">`,
    `<meta property="og:title" content="${escapeAttr(route.ogTitle)}" data-rh="true">`,
    `<meta property="og:description" content="${escapeAttr(route.ogDescription)}" data-rh="true">`,
    `<meta property="og:url" content="${escapeAttr(url)}" data-rh="true">`,
    `<meta name="twitter:title" content="${escapeAttr(route.ogTitle)}" data-rh="true">`,
    `<meta name="twitter:description" content="${escapeAttr(route.ogDescription)}" data-rh="true">`,
  ]
    .map((t) => `    ${t}`)
    .join("\n");

  return html.replace(/<\/head>/i, `${tags}\n  </head>`);
}

/**
 * Emits a static HTML file per public route (dist/<route>/index.html) with
 * route-specific metadata baked into the initial HTML response.
 * The SPA bundle is unchanged, so client-side routing keeps working.
 */
export function seoPrerender(): Plugin {
  return {
    name: "norskly-seo-prerender",
    apply: "build",
    closeBundle() {
      const outDir = path.resolve(process.cwd(), "dist");
      const indexPath = path.join(outDir, "index.html");
      if (!fs.existsSync(indexPath)) return;
      const baseHtml = fs.readFileSync(indexPath, "utf8");

      for (const route of SEO_ROUTES) {
        const html = buildRouteHtml(baseHtml, route);
        const target =
          route.path === "/"
            ? indexPath
            : path.join(outDir, route.path.replace(/^\//, ""), "index.html");
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, html, "utf8");
      }
      // eslint-disable-next-line no-console
      console.log(`[seo-prerender] wrote ${SEO_ROUTES.length} route HTML files`);
    },
  };
}
