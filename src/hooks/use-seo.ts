import { useEffect } from "react";
import { canonicalFor, DEFAULT_IMAGE } from "@/lib/seo";

interface SeoOptions {
  /** Route path, e.g. "/blog/my-post". */
  path: string;
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article";
}

function upsertMeta(attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

/**
 * Keeps canonical and social tags in sync during client-side navigation.
 * The build already bakes these into each prerendered page (see vite.config.ts);
 * this only matters once React Router takes over and swaps routes in place.
 */
export function useSeo({ path, title, description, image, type = "website" }: SeoOptions) {
  useEffect(() => {
    const canonical = canonicalFor(path);

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical;

    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:image", image ?? DEFAULT_IMAGE);
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image ?? DEFAULT_IMAGE);
  }, [path, title, description, image, type]);
}

/**
 * Marks the current view as noindex and drops any canonical a previously
 * rendered route left in the head.
 *
 * The 404 page is what renders under every unmatched URL, so without this it
 * would hand search engines an unbounded set of indexable pages all pointing at
 * one canonical - which is what gets reported as duplicate content. The static
 * /404.html carries the same robots tag for crawlers that never run this bundle.
 */
export function useNoIndex() {
  useEffect(() => {
    document.head.querySelector('link[rel="canonical"]')?.remove();

    let meta = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex, follow");

    return () => meta.remove();
  }, []);
}
