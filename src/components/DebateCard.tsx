import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface DebateCardProps {
  tagline: string;
  evidence: string;
  citation: string;
  link: string;
  index: number;
}

export const DebateCard = ({ tagline, evidence, citation, link, index }: DebateCardProps) => {
  return (
    <Card 
      className="h-full transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-bottom-4"
      style={{ 
        animationDelay: `${index * 100}ms`,
        background: 'var(--gradient-card)',
        boxShadow: 'var(--shadow-card)'
      }}
    >
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary leading-tight">
          {tagline}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {evidence}
          </p>
        </div>
        <div className="pt-4 border-t border-border">
          <p className="text-xs font-medium text-foreground mb-2">
            {citation}
          </p>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-accent hover:text-primary transition-colors group"
          >
            <span>View source</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
};
