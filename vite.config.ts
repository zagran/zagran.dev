import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import {
  getRoutes,
  canonicalFor,
  DEFAULT_IMAGE,
  SITE_URL,
  SITE_NAME,
  AUTHOR,
  type RouteSeo,
} from "./src/lib/seo";

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Replaces the content="" of an existing meta tag, or appends it if absent. */
function setMeta(html: string, attr: "name" | "property", key: string, value: string): string {
  const pattern = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
  const tag = `<meta ${attr}="${key}" content="${escapeAttr(value)}" />`;
  return pattern.test(html)
    ? html.replace(pattern, `$1${escapeAttr(value)}$2`)
    : html.replace("</head>", `    ${tag}\n  </head>`);
}

function structuredData(route: RouteSeo): string {
  const schema =
    route.type === "article"
      ? {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: route.title,
          description: route.description,
          image: route.image,
          datePublished: route.date,
          dateModified: route.date,
          keywords: route.tags?.join(", "),
          author: { "@type": "Person", name: AUTHOR, url: SITE_URL },
          publisher: { "@type": "Person", name: AUTHOR, url: SITE_URL },
          mainEntityOfPage: { "@type": "WebPage", "@id": canonicalFor(route.path) },
        }
      : {
          "@context": "https://schema.org",
          "@type": "Person",
          name: AUTHOR,
          url: SITE_URL,
          jobTitle: "Senior Software Engineer",
          sameAs: [
            "https://github.com/zagran",
            "https://medium.com/@zagran",
            "https://dev.to/zagran",
          ],
        };

  // "<" is escaped so the payload can never close the script tag early.
  return `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>`;
}

/** Bakes a route's metadata into a copy of the built index.html. */
function renderRoute(baseHtml: string, route: RouteSeo): string {
  const canonical = canonicalFor(route.path);
  let html = baseHtml;

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(route.title)}</title>`);
  html = setMeta(html, "name", "description", route.description);
  html = setMeta(html, "property", "og:title", route.title);
  html = setMeta(html, "property", "og:description", route.description);
  html = setMeta(html, "property", "og:url", canonical);
  html = setMeta(html, "property", "og:image", route.image);
  html = setMeta(html, "property", "og:type", route.type);
  html = setMeta(html, "property", "og:site_name", SITE_NAME);
  // A real cover image earns the wide card; the square fallback portrait does not.
  html = setMeta(
    html,
    "name",
    "twitter:card",
    route.image === DEFAULT_IMAGE ? "summary" : "summary_large_image"
  );
  html = setMeta(html, "name", "twitter:title", route.title);
  html = setMeta(html, "name", "twitter:description", route.description);
  html = setMeta(html, "name", "twitter:image", route.image);

  const head: string[] = [`<link rel="canonical" href="${canonical}" />`];
  if (route.type === "article") {
    head.push(`<meta property="article:published_time" content="${route.date}" />`);
    head.push(`<meta property="article:author" content="${escapeAttr(AUTHOR)}" />`);
    for (const tag of route.tags ?? []) {
      head.push(`<meta property="article:tag" content="${escapeAttr(tag)}" />`);
    }
  }
  head.push(structuredData(route));

  return html.replace("</head>", `    ${head.join("\n    ")}\n  </head>`);
}

/**
 * Emits a real HTML file per route with its own canonical/OG/JSON-LD, plus
 * sitemap.xml. Social crawlers don't run JS, so these tags have to be static.
 * Requires the CloudFront function in terraform/functions/rewrite-uri.js to
 * map /blog/foo -> /blog/foo/index.html.
 */
function prerender(): Plugin {
  return {
    name: "prerender-routes",
    apply: "build",
    closeBundle() {
      const dist = path.resolve(__dirname, "dist");
      const baseHtml = fs.readFileSync(path.join(dist, "index.html"), "utf-8");
      const routes = getRoutes();

      // The CloudFront rewrite keys off "no dot in the last path segment", so a
      // slug containing a dot would be served as a file and never reach its page.
      const dotted = routes.filter((route) => route.path.split("/").pop()?.includes("."));
      if (dotted.length) {
        throw new Error(
          `Route slugs must not contain dots (breaks the CloudFront rewrite): ${dotted
            .map((route) => route.path)
            .join(", ")}`
        );
      }

      for (const route of routes) {
        const html = renderRoute(baseHtml, route);
        const outPath =
          route.path === "/"
            ? path.join(dist, "index.html")
            : path.join(dist, route.path, "index.html");

        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, html);
      }

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) =>
      `  <url>\n    <loc>${canonicalFor(route.path)}</loc>\n    <lastmod>${route.date}</lastmod>\n    <priority>${
        route.path === "/" ? "1.0" : route.type === "article" ? "0.8" : "0.9"
      }</priority>\n  </url>`
  )
  .join("\n")}
</urlset>\n`;
      fs.writeFileSync(path.join(dist, "sitemap.xml"), sitemap);

      console.log(`prerendered ${routes.length} routes + sitemap.xml`);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger(), prerender()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
