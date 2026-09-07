import ReactMarkdown from "react-markdown";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { LEGAL_EFFECTIVE_DATE } from "@/data/legal";

interface LegalPageProps {
  title: string;
  content: string;
}

export const LegalPage = ({ title, content }: LegalPageProps) => (
  <div className="min-h-screen bg-background flex flex-col">
    <Navigation />

    <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-3xl">
        <header className="space-y-3 mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">Effective {LEGAL_EFFECTIVE_DATE}</p>
        </header>

        <div
          className="prose prose-lg prose-slate dark:prose-invert max-w-none
            prose-headings:text-foreground prose-headings:font-bold
            prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-10
            prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
            prose-strong:text-foreground prose-strong:font-semibold
            prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
            prose-li:text-muted-foreground prose-li:mb-2
            prose-a:text-primary prose-a:no-underline hover:prose-a:text-primary/80 hover:prose-a:underline"
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </main>

    <Footer />
  </div>
);
