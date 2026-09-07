import { Link } from "react-router-dom";

export const Footer = () => (
  <footer className="py-8 border-t border-border">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-center sm:text-left text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Serhii Zahranychnyi. Senior Software Engineer passionate about
          building innovative solutions.
        </p>
        <nav className="flex items-center justify-center gap-6 text-sm shrink-0">
          <Link to="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
        </nav>
      </div>
    </div>
  </footer>
);
