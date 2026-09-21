/**
 * Markup shared between the runtime <BlogPost> page and the build-time
 * prerender in vite.config.ts, so a crawler and a browser see the same article.
 *
 * Relative-import-safe: vite.config.ts pulls this in, where the "@" alias does
 * not resolve. Keeping the class strings in src/ also keeps them inside
 * Tailwind's content globs, so the utilities actually get generated.
 */

import { createElement } from "react";

/** Typography classes for the rendered markdown body. */
export const ARTICLE_PROSE_CLASSES = `prose prose-lg prose-slate dark:prose-invert max-w-none
  prose-headings:text-foreground prose-headings:font-bold
  prose-h1:text-4xl prose-h1:mb-4 prose-h1:mt-8
  prose-h2:text-3xl prose-h2:mb-3 prose-h2:mt-8
  prose-h3:text-2xl prose-h3:mb-2 prose-h3:mt-6
  prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
  prose-strong:text-foreground prose-strong:font-semibold
  prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
  prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
  prose-li:text-muted-foreground prose-li:mb-2
  prose-code:text-foreground prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-[''] prose-code:after:content-['']
  prose-pre:bg-secondary prose-pre:text-foreground prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:my-4
  prose-a:text-primary prose-a:no-underline hover:prose-a:text-primary/80 hover:prose-a:underline
  prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:italic
  prose-img:rounded-lg prose-img:shadow-md`;

export const ARTICLE_TITLE_CLASSES =
  "text-4xl sm:text-5xl font-bold text-foreground leading-tight";

export const ARTICLE_EXCERPT_CLASSES = "text-xl text-muted-foreground leading-relaxed";

/** The id of the static article node the prerender emits; main.tsx removes it. */
export const PRERENDER_ID = "prerender";

/**
 * Markdown renderer overrides shared by <BlogPost> and the prerender, so the
 * static HTML a crawler gets and the DOM React mounts stay identical.
 *
 * Article bodies run to several images and most of them sit well below the
 * fold, so everything after the first is deferred. The first one is the cover:
 * it is the largest contentful paint, and deferring it would delay the paint
 * rather than save anything, so it stays eager.
 *
 * This is a factory because the counter has to start at zero for each render
 * pass rather than be shared across every article ever rendered.
 */
export function articleMarkdownComponents() {
  let index = 0;

  return {
    img({ node, ...props }: { node?: unknown } & Record<string, unknown>) {
      const isCover = index++ === 0;
      return createElement("img", {
        ...props,
        loading: isCover ? "eager" : "lazy",
        decoding: "async",
      });
    },
  };
}
