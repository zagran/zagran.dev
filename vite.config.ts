import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { blogPosts } from "./src/data/blogPosts";
import {
  ARTICLE_EXCERPT_CLASSES,
  ARTICLE_PROSE_CLASSES,
  ARTICLE_TITLE_CLASSES,
  PRERENDER_ID,
} from "./src/lib/article-markup";
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

/** Renders a post's markdown with the same renderer the page uses at runtime. */
async function renderMarkdown(markdown: string): Promise<string> {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { default: ReactMarkdown } = await import("react-markdown");
  return renderToStaticMarkup(createElement(ReactMarkdown, null, markdown));
}

/**
 * The article, as static HTML, for clients that never run the bundle: social
 * crawlers, search engines, and importers like Medium's Import Story - which
 * fails outright on a page whose body is just an empty #root div.
 *
 * main.tsx removes this node before mounting React, so it is a placeholder,
 * not a second copy of the article. It mirrors <BlogPost>'s structure and
 * reuses its class strings so the swap is not visible.
 */
async function articleBody(post: (typeof blogPosts)[number]): Promise<string> {
  const content = await renderMarkdown(post.content);
  return [
    `<div id="${PRERENDER_ID}" class="min-h-screen bg-background">`,
    `  <article class="pt-24 pb-16 px-4 sm:px-6 lg:px-8">`,
    `    <div class="container mx-auto max-w-4xl">`,
    `      <header class="space-y-6 mb-12">`,
    `        <h1 class="${ARTICLE_TITLE_CLASSES}">${escapeAttr(post.title)}</h1>`,
    `        <p class="${ARTICLE_EXCERPT_CLASSES}">${escapeAttr(post.excerpt)}</p>`,
    `      </header>`,
    `      <div class="${ARTICLE_PROSE_CLASSES}">${content}</div>`,
    `    </div>`,
    `  </article>`,
    `</div>`,
  ].join("\n");
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
    async closeBundle() {
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

      const postsById = new Map(blogPosts.map((post) => [`/blog/${post.id}`, post]));

      for (const route of routes) {
        let html = renderRoute(baseHtml, route);

        const post = postsById.get(route.path);
        if (post) {
          html = html.replace("</body>", `    ${await articleBody(post)}\n  </body>`);
        }

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
        route.priority ?? (route.path === "/" ? "1.0" : route.type === "article" ? "0.8" : "0.9")
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
