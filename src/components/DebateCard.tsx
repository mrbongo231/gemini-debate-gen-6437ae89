import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Copy, Check, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  // Normalize evidence: ensure underline within marks, never bold outside marks
  const normalizeEvidenceHtml = (html: string) => {
    const noStrong = html.replace(/<\/?strong>/g, "");
    return noStrong.replace(/<mark>([\s\S]*?)<\/mark>/g, (_m, inner) => {
      const cleaned = String(inner).replace(/<\/?u>/g, "");
      return `<mark><u>${cleaned}</u></mark>`; // preserves any existing <b> inside
    });
  };

  const [linkStatus, setLinkStatus] = useState<"checking" | "ok" | "bad">("checking");
  const [resolvedLink, setResolvedLink] = useState(link);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("check-url", { body: { url: link } });
        if (!active) return;
        if (error || !data) {
          setLinkStatus("bad");
          setResolvedLink(link);
        } else {
          setLinkStatus(data.ok ? "ok" : "bad");
          setResolvedLink(data.finalUrl ?? link);
        }
      } catch {
        if (active) {
          setLinkStatus("bad");
          setResolvedLink(link);
        }
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [link]);

  const copyCard = async () => {
    // Convert <mark> to inline-styled <span> so Google Docs preserves highlighting
    const toDocsHtml = (html: string) =>
      html
        .replace(/<\/?strong>/g, "")
        .replace(/<mark>([\s\S]*?)<\/mark>/g, (_m, inner) => {
          const cleaned = String(inner).replace(/<\/?u>/g, "");
          return '<span style="background-color:#fff176; padding:0 2px; text-decoration: underline;">' + cleaned + '</span>';
        });

    const stripTags = (html: string) => html.replace(/<[^>]*>/g, '');
    const escapeHtml = (text: string) =>
      text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const evidenceHtml = toDocsHtml(evidence);

    // Assemble preferred copy order (no labels): Tagline, Citation, URL, then Evidence
    const htmlContent = `
      <div>
        <div>${escapeHtml(tagline)}</div>
        <div>${escapeHtml(citation)}</div>
        <div><a href="${resolvedLink}" target="_blank" rel="noopener noreferrer">${resolvedLink}</a></div>
        <div style="margin-top:8px;" class="debate-evidence">${evidenceHtml}</div>
      </div>`;

    const plainText = `${tagline}\n${citation}\n${resolvedLink}\n\n${stripTags(evidence)}`;

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
        description: "Optimized for Google Docs: highlighting, bold, and underline preserved.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback to plain text
      await navigator.clipboard.writeText(plainText);
      toast({
        title: "Card copied (plain text)",
        description: "Your browser blocked rich HTML copy.",
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
        <div className="flex items-start justify-between gap-2">
          <CardDescription className="text-xs font-medium text-foreground">
            {citation}
          </CardDescription>
          <a
            href={resolvedLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-accent hover:text-primary transition-colors group"
          >
            {linkStatus === "ok" ? (
              <CheckCircle className="w-3 h-3 text-primary" />
            ) : linkStatus === "bad" ? (
              <XCircle className="w-3 h-3 text-destructive" />
            ) : null}
            <span>Source</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
        <CardTitle className="text-xl font-semibold text-primary leading-tight">
          {tagline}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p 
            className="text-sm text-muted-foreground leading-relaxed debate-evidence"
            dangerouslySetInnerHTML={{ __html: normalizeEvidenceHtml(evidence) }}
          />
        </div>
        <div className="pt-4 border-t border-border">
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
        </div>
      </CardContent>
    </Card>
  );
};
