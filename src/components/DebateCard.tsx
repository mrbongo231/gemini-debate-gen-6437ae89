import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface DebateCardProps {
  tagline: string;
  evidence: string;
  citation: string;
  link: string;
  index: number;
}

export const DebateCard = ({ tagline, evidence, citation, link, index }: DebateCardProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyCard = async () => {
    const htmlContent = `<strong>Tagline:</strong> ${tagline}<br><strong>Citation:</strong> ${citation}<br><strong>Evidence:</strong> ${evidence}`;
    const plainText = `Tagline: ${tagline}\nCitation: ${citation}\nEvidence: ${evidence.replace(/<[^>]*>/g, '')}`;

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' })
        })
      ]);
      setCopied(true);
      toast({
        title: "Card copied!",
        description: "HTML formatting preserved for pasting into Word/Google Docs",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback to plain text
      await navigator.clipboard.writeText(plainText);
      toast({
        title: "Card copied (plain text)",
        description: "HTML formatting not supported by your browser",
      });
    }
  };

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
          <p 
            className="text-sm text-muted-foreground leading-relaxed debate-evidence"
            dangerouslySetInnerHTML={{ __html: evidence }}
          />
        </div>
        <div className="pt-4 border-t border-border space-y-3">
          <p className="text-xs font-medium text-foreground">
            {citation}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyCard}
              className="text-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Card
                </>
              )}
            </Button>
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
        </div>
      </CardContent>
    </Card>
  );
};
