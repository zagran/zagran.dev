/**
 * Markup shared between the runtime <BlogPost> page and the build-time
 * prerender in vite.config.ts, so a crawler and a browser see the same article.
 *
 * Relative-import-safe: vite.config.ts pulls this in, where the "@" alias does
 * not resolve. Keeping the class strings in src/ also keeps them inside
 * Tailwind's content globs, so the utilities actually get generated.
 */

import { Children, cloneElement, createElement, isValidElement, type ReactNode } from "react";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

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
  prose-img:rounded-lg prose-img:shadow-md
  prose-th:text-foreground prose-td:text-muted-foreground
  prose-thead:border-border prose-tr:border-border`;

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
/**
 * Drops the newline CommonMark puts at the end of every fenced code block.
 *
 * `white-space: pre` renders that newline as a blank final line, so each block
 * carried a line of dead space above its bottom padding. Only the last text
 * leaf is trimmed, and only one newline, so a block is never shortened past
 * its real content.
 */
function trimTrailingNewline(children: ReactNode): ReactNode {
  const nodes = Children.toArray(children);
  const last = nodes[nodes.length - 1];

  if (typeof last === "string") {
    nodes[nodes.length - 1] = last.replace(/\n$/, "");
  } else if (isValidElement<{ children?: ReactNode }>(last)) {
    nodes[nodes.length - 1] = cloneElement(
      last,
      undefined,
      trimTrailingNewline(last.props.children)
    );
  }

  return nodes;
}

export function articleMarkdownComponents() {
  let index = 0;

  return {
    pre({ node, children, ...props }: { node?: unknown; children?: ReactNode } & Record<string, unknown>) {
      return createElement("pre", props, trimTrailingNewline(children));
    },

    table({ node, ...props }: { node?: unknown } & Record<string, unknown>) {
      // Typography styles the table but gives it nowhere to go when it is wider
      // than the column, so the cheat-sheet tables scroll on their own.
      return createElement(
        "div",
        { className: "overflow-x-auto" },
        createElement("table", props)
      );
    },

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

/**
 * Remark plugins for article bodies, shared by both renderers.
 *
 * GFM is here for tables. Without it react-markdown emits a pipe-delimited
 * paragraph, which is how the table in the AWS disaster-recovery post shipped
 * for a while before anyone noticed. It also turns on strikethrough, task
 * lists, footnotes and bare-URL autolinking, none of which any current post
 * relies on.
 */
export const ARTICLE_REMARK_PLUGINS = [remarkGfm];

/**
 * Rehype plugins for article bodies, shared by both renderers.
 *
 * rehype-raw is what lets a post embed real HTML - specifically the inline SVG
 * diagrams, which need to be markup rather than an image so they can follow the
 * theme's CSS variables and scale to the column instead of shipping a raster at
 * two sizes.
 *
 * The trust boundary matters: this disables react-markdown's HTML escaping, so
 * anything in a post body renders as written. That is safe only because post
 * content is authored in src/data/blogPosts.ts and ships through a build. Never
 * feed reader-supplied or fetched markdown through this pipeline - it would be
 * a straight XSS path, and it would need rehype-sanitize in front of it.
 */
export const ARTICLE_REHYPE_PLUGINS = [rehypeRaw];
