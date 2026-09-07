// Relative import (not the "@" alias) so vite.config.ts can import this at build time.
import { blogPosts } from "../data/blogPosts";

export const SITE_URL = "https://zagran.dev";
export const SITE_NAME = "Serhii Zahranychnyi";
export const AUTHOR = "Serhii Zahranychnyi";
export const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

export const SITE_TITLE = "Serhii Zahranychnyi — Senior Software Engineer | Building Scalable Fintech Solutions";
export const SITE_DESCRIPTION =
  "Senior Software Engineer at Capital One creating innovative digital solutions in fintech, Python, React, and cloud technologies.";

export interface RouteSeo {
  /** Route path, always with a leading slash and no trailing slash (except "/"). */
  path: string;
  title: string;
  description: string;
  image: string;
  type: "website" | "article";
  /** ISO date used for sitemap lastmod and, for articles, published time. */
  date: string;
  tags?: string[];
}

/** Pulls the first markdown image out of a post body, for use as its share card. */
export function firstImage(content: string): string | undefined {
  return content.match(/!\[[^\]]*\]\(([^)\s]+)\)/)?.[1];
}

/** Every route the site can serve, with the metadata its <head> should carry. */
export function getRoutes(): RouteSeo[] {
  const newest = blogPosts.map((post) => post.date).sort().reverse()[0];

  return [
    {
      path: "/",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      image: DEFAULT_IMAGE,
      type: "website",
      date: newest,
    },
    {
      path: "/blog",
      title: "Articles on Software Engineering, Cloud Architecture & Fintech",
      description:
        "Writing on cloud architecture, AI tooling, platform engineering, and fintech infrastructure — published here and in Level Up Coding, The Applied Engineer, and The Startup.",
      image: DEFAULT_IMAGE,
      type: "website",
      date: newest,
    },
    ...blogPosts.map((post): RouteSeo => ({
      path: `/blog/${post.id}`,
      title: post.seoTitle || post.title,
      description: post.excerpt,
      image: post.coverImage || firstImage(post.content) || DEFAULT_IMAGE,
      type: "article",
      date: post.date,
      tags: post.tags,
    })),
  ];
}

export function canonicalFor(path: string): string {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}
