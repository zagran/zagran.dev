import { Navigation } from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { Link, useParams, Navigate } from "react-router-dom";
import { blogPosts } from "@/data/blogPosts";
import ReactMarkdown from "react-markdown";

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const post = blogPosts.find((p) => p.id === id);

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

            <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
              {post.title}
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed">{post.excerpt}</p>

            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </header>

          {/* Article Content */}
          <div className="prose prose-slate max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-secondary prose-pre:text-foreground prose-a:text-primary hover:prose-a:text-primary/80">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* Article Footer */}
          <footer className="mt-12 pt-8 border-t border-border">
            <Button variant="ghost" asChild>
              <Link to="/blog">
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
          </footer>
        </div>
      </article>
    </div>
  );
};

export default BlogPost;
