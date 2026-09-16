import { Navigation } from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { Link, useParams, Navigate } from "react-router-dom";
import { blogPosts } from "@/data/blogPosts";
import ReactMarkdown from "react-markdown";
import { Footer } from "@/components/Footer";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useSeo } from "@/hooks/use-seo";
import { shareImage, DEFAULT_IMAGE } from "@/lib/seo";
import {
  ARTICLE_EXCERPT_CLASSES,
  ARTICLE_PROSE_CLASSES,
  ARTICLE_TITLE_CLASSES,
} from "@/lib/article-markup";

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const post = blogPosts.find((p) => p.id === id);

  useDocumentTitle(post ? (post.seoTitle || post.title) : "Blog Post", "");
  useSeo({
    path: `/blog/${id}`,
    title: post ? post.seoTitle || post.title : "Blog Post",
    description: post?.excerpt ?? "",
    image: post ? shareImage(post) : DEFAULT_IMAGE,
    type: "article",
  });

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

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
            <ReactMarkdown>{post.content}</ReactMarkdown>
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
