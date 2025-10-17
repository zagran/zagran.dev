import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SkillCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  emoji: string;
}

export const SkillCard = ({ icon: Icon, title, description, emoji }: SkillCardProps) => {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/50 bg-card">
      <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
        <div className="text-4xl">{emoji}</div>
        <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
};
