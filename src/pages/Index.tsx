import { Navigation } from "@/components/Navigation";
import { SkillCard } from "@/components/SkillCard";
import { BlogCard } from "@/components/BlogCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Linkedin, Github, Mail, BookOpen, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import profileImage from "@/assets/profile.png";
import { blogPosts } from "@/data/blogPosts";

const Index = () => {
  const skills = [
    {
      emoji: "🐍",
      title: "Backend Development",
      description: "Python, Django, Node.js, APIs, and scalable server architecture",
    },
    {
      emoji: "⚛️",
      title: "Frontend Development",
      description: "React, Vue, JavaScript, TypeScript, and modern web frameworks",
    },
    {
      emoji: "☁️",
      title: "Cloud & DevOps",
      description: "AWS, Docker, CI/CD, Lambda, and infrastructure automation",
    },
    {
      emoji: "🏦",
      title: "Financial Technology",
      description: "Enterprise solutions, data processing, and secure banking systems",
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
                  Software Developer at Capital One
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
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                </Button>
                <Button variant="social" size="default" asChild>
                  <a href="https://github.com/zagran" target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
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
                      Software Developer @ Capital One
                    </p>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <span>🏦</span>
                      Building fintech solutions at Capital One
                    </p>
                    <p className="flex items-center gap-2">
                      <span>📍</span>
                      McLean, Virginia
                    </p>
                    <p className="flex items-center gap-2">
                      <span>💡</span>
                      Python & Django enthusiast
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
              <SkillCard key={skill.title} {...skill} icon={Github} />
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
          <p>© 2025 Serhii Zahranychnyi. Software Developer passionate about building innovative solutions.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
