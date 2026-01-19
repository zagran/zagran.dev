import { Navigation } from "@/components/Navigation";
import { SkillCard } from "@/components/SkillCard";
import { BlogCard } from "@/components/BlogCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LinkedinIcon, GithubIcon, Mail, BookOpen, ArrowRight, Code2, Users } from "lucide-react";
import { Link } from "react-router-dom";
import profileImage from "@/assets/profile.png";
import { blogPosts } from "@/data/blogPosts";
import { useDocumentTitle } from "@/hooks/use-document-title";

const Index = () => {
  useDocumentTitle("Serhii Zahranychnyi — Senior Software Engineer | Building Scalable Fintech Solutions", "");
  const skills = [
    {
      emoji: "🐍",
      title: "Backend Development",
      description: "Python, Node.js, Java, Go, RESTful APIs, and scalable server architecture",
    },
    {
      emoji: "⚛️",
      title: "Frontend Development",
      description: "React, JavaScript, TypeScript, and modern web frameworks",
    },
    {
      emoji: "☁️",
      title: "Cloud Platforms",
      description: "AWS, GCP, Azure, and multi-cloud infrastructure",
    },
    {
      emoji: "🗄️",
      title: "Databases",
      description: "Oracle Database, PostgreSQL, MySQL, MongoDB, DynamoDB, and SQL optimization",
    },
    {
      emoji: "🚀",
      title: "DevOps & Infrastructure",
      description: "Docker, Kubernetes, Terraform, CI/CD, and container orchestration",
    },
    {
      emoji: "⚡",
      title: "Data Engineering",
      description: "PySpark, data processing pipelines, and analytics at scale",
    },
    {
      emoji: "🏦",
      title: "Financial Technology",
      description: "Enterprise solutions, data processing, and secure banking systems",
    },
    {
      emoji: "🔧",
      title: "System Design",
      description: "Microservices, distributed systems, and scalable architectures",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 text-center md:text-left">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                  <span className="text-foreground">Serhii</span>
                  <br />
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Zahranychnyi
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground">
                  Senior Software Engineer at Capital One
                </p>
              </div>

              <p className="text-base text-muted-foreground leading-relaxed max-w-lg mx-auto md:mx-0">
                Passionate software developer creating innovative digital solutions and building
                scalable applications that make a difference. Currently working at Capital One,
                focusing on cutting-edge financial technology and enterprise solutions.
              </p>

              {/* Social Links */}
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Button variant="social" size="default" asChild>
                  <a
                    href="https://www.linkedin.com/in/zagran/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LinkedinIcon className="h-4 w-4" />
                    LinkedIn
                  </a>
                </Button>
                <Button variant="social" size="default" asChild>
                  <a href="https://github.com/zagran" target="_blank" rel="noopener noreferrer">
                    <GithubIcon className="h-4 w-4" />
                    GitHub
                  </a>
                </Button>
                <Button variant="social" size="default" asChild>
                  <a href="https://medium.com/@zagran" target="_blank" rel="noopener noreferrer">
                    <BookOpen className="h-4 w-4" />
                    Medium
                  </a>
                </Button>
                <Button variant="social" size="default" asChild>
                  <a href="https://dev.to/zagran" target="_blank" rel="noopener noreferrer">
                    <Code2 className="h-4 w-4" />
                    Dev.to
                  </a>
                </Button>
                <Button variant="social" size="default" asChild>
                  <a href="https://mentor.sh/mentors/zagran" target="_blank" rel="noopener noreferrer">
                    <Users className="h-4 w-4" />
                    Mentor.sh
                  </a>
                </Button>
                <Button variant="social" size="default" asChild>
                  <a href="https://adplist.org/mentors/serhii-zahranychnyi" target="_blank" rel="noopener noreferrer">
                    <Users className="h-4 w-4" />
                    ADPList
                  </a>
                </Button>
                <Button variant="social" size="default" asChild>
                  <a href="mailto:szahranychnyi@gmail.com">
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                </Button>
              </div>
            </div>

            {/* Right Content - Profile Card */}
            <div className="flex justify-center md:justify-end">
              <Card className="w-full max-w-sm shadow-lg border-border hover:shadow-xl transition-shadow">
                <CardContent className="p-8 space-y-6">
                  <div className="flex justify-center">
                    <img
                      src={profileImage}
                      alt="Serhii Zahranychnyi"
                      className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">Serhii Zahranychnyi</h3>
                    <p className="text-sm text-muted-foreground">
                      Senior Software Engineer @ Capital One
                    </p>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <span>🏦</span>
                      Changing banking for good with humanity, ingenuity and simplicity
                    </p>
                    <p className="flex items-center gap-2">
                      <span>📍</span>
                      McLean, Virginia
                    </p>
                    <p className="flex items-center gap-2">
                      <span>💡</span>
                      Python & Django enthusiast
                    </p>
                    <p className="flex items-center gap-2">
                      <span>🎓</span>
                      <a
                        href="https://www.credly.com/badges/2752fffe-45dd-4993-99d6-ce3f12790e2f/zagran.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors underline decoration-dotted"
                      >
                        AWS Certified Solutions Architect
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-16 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">What I Do</h2>
            <p className="text-lg text-muted-foreground">
              Turning ideas into reality through code and innovation
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {skills.map((skill) => (
              <SkillCard key={skill.title} {...skill} icon={GithubIcon} />
            ))}
          </div>
        </div>
      </section>

      {/* Blog Preview Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Latest Articles</h2>
              <p className="text-lg text-muted-foreground">
                Insights on software development and fintech
              </p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link to="/blog">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {blogPosts.slice(0, 2).map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <Button variant="ghost" asChild>
              <Link to="/blog">
                View All Articles
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="container mx-auto max-w-2xl text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Let's Connect</h2>
          <p className="text-lg text-muted-foreground">
            Interested in collaborating or discussing opportunities in fintech and software
            development? I'd love to hear from you!
          </p>
          <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow">
            <a href="mailto:szahranychnyi@gmail.com">
              <Mail className="h-5 w-5" />
              Get In Touch
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Serhii Zahranychnyi. Senior Software Engineer passionate about building innovative solutions.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
