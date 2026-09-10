import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { SEO_ROUTES, SITE_URL, type RouteSeo } from "./routes";

const escapeAttr = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Serialize JSON-LD so it is safe to embed inside a <script> tag. */
function serializeJsonLd(value: object): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003C")
    .replace(/>/g, "\\u003E");
}

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

  const tags: string[] = [
    `<title>${escapeHtml(route.title)}</title>`,
    `<meta name="description" content="${escapeAttr(route.description)}" data-rh="true">`,
    `<link rel="canonical" href="${escapeAttr(url)}">`,
    `<meta property="og:title" content="${escapeAttr(route.ogTitle)}" data-rh="true">`,
    `<meta property="og:description" content="${escapeAttr(route.ogDescription)}" data-rh="true">`,
    `<meta property="og:url" content="${escapeAttr(url)}" data-rh="true">`,
    `<meta name="twitter:title" content="${escapeAttr(route.ogTitle)}" data-rh="true">`,
    `<meta name="twitter:description" content="${escapeAttr(route.ogDescription)}" data-rh="true">`,
  ];

  if (route.structuredData) {
    const schemaWithUrl = { ...route.structuredData, url: url };
    tags.push(
      `<script type="application/ld+json">${serializeJsonLd(schemaWithUrl)}</script>`
    );
  }

  const tagsBlock = tags.map((t) => `    ${t}`).join("\n");

  return html.replace(/<\/head>/i, `${tagsBlock}\n  </head>`);
}

/** Legacy paths that should send visitors to a current URL. */
export const LEGACY_REDIRECTS: { from: string; to: string }[] = [
  { from: "/home", to: "/" },
];

/**
 * Build a redirect document from the base index.html shell:
 * instant meta refresh + self-canonical pointing at the target URL,
 * plus a visible link so users without JS/meta-refresh can continue.
 */
export function buildRedirectHtml(baseHtml: string, targetUrl: string): string {
  let html = baseHtml;

  html = html
    .replace(/[ \t]*<link\s+rel="canonical"[^>]*>\s*\n?/gi, "")
    .replace(/[ \t]*<meta\s+http-equiv="refresh"[^>]*>\s*\n?/gi, "");

  const head = [
    `<meta http-equiv="refresh" content="0; url=${escapeAttr(targetUrl)}">`,
    `<link rel="canonical" href="${escapeAttr(targetUrl)}">`,
  ]
    .map((t) => `    ${t}`)
    .join("\n");

  html = html.replace(/<\/head>/i, `${head}\n  </head>`);

  const fallback =
    `<p style="font-family:system-ui,sans-serif;padding:2rem;text-align:center">` +
    `Ova stranica je premeštena. ` +
    `<a href="${escapeAttr(targetUrl)}">Idi na početnu stranicu</a>.</p>`;

  return html.replace(/<div id="root"><\/div>/i, `${fallback}\n    <div id="root"></div>`);
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
      for (const redirect of LEGACY_REDIRECTS) {
        const targetUrl = SITE_URL + (redirect.to === "/" ? "/" : redirect.to);
        const html = buildRedirectHtml(baseHtml, targetUrl);
        const target = path.join(outDir, redirect.from.replace(/^\//, ""), "index.html");
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, html, "utf8");
      }
      // eslint-disable-next-line no-console
      console.log(
        `[seo-prerender] wrote ${SEO_ROUTES.length} route HTML files and ${LEGACY_REDIRECTS.length} redirect files`
      );
    },
  };
}
