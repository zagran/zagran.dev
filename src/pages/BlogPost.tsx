import { Navigation } from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { blogPosts, type BlogPost as Post } from "@/data/blogPosts";
import ReactMarkdown from "react-markdown";
import { Footer } from "@/components/Footer";
import NotFound from "./NotFound";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useSeo } from "@/hooks/use-seo";
import { shareImage } from "@/lib/seo";
import {
  articleMarkdownComponents,
  ARTICLE_EXCERPT_CLASSES,
  ARTICLE_PROSE_CLASSES,
  ARTICLE_TITLE_CLASSES,
} from "@/lib/article-markup";

/**
 * An unknown slug renders the 404 page in place. It used to redirect to /blog,
 * which meant every stale or mistyped article URL a crawler knew about answered
 * with a redirect instead of "gone" - reported as "Page with redirect". Keeping
 * the lookup in a wrapper also means useSeo never runs with a slug that has no
 * post, so no canonical is ever claimed for a URL that does not exist.
 */
const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const post = blogPosts.find((p) => p.id === id);

  return post ? <BlogPostView post={post} /> : <NotFound />;
};

const BlogPostView = ({ post }: { post: Post }) => {
  useDocumentTitle(post.seoTitle || post.title, "");
  useSeo({
    path: `/blog/${post.id}`,
    title: post.seoTitle || post.title,
    description: post.excerpt,
    image: shareImage(post),
    type: "article",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <article className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-8">
            <Link to="/blog">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
          </Button>

          {/* Article Header */}
          <header className="space-y-6 mb-12">
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              <Badge variant="secondary">{post.category}</Badge>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(post.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.readTime}
              </span>
            </div>

            <h1 className={ARTICLE_TITLE_CLASSES}>
              {post.title}
            </h1>

            <p className={ARTICLE_EXCERPT_CLASSES}>{post.excerpt}</p>

            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </header>

          {/* Article Content */}
          <div className={ARTICLE_PROSE_CLASSES}>
            <ReactMarkdown components={articleMarkdownComponents()}>
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Article Footer */}
          <footer className="mt-12 pt-8 border-t border-border">
            {post.mediumUrl && (
              <p className="text-sm text-muted-foreground mb-6">
                Originally published{post.publication ? ` in ${post.publication}` : ""} on{" "}
                <a
                  href={post.mediumUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Medium
                </a>
              </p>
            )}
            <Button variant="ghost" asChild>
              <Link to="/blog">
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
          </footer>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogPost;
