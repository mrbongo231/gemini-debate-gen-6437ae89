import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DebateCard } from "@/components/DebateCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";

interface DebateCardData {
  tagline: string;
  evidence: string;
  citation: string;
  link: string;
}

const Index = () => {
  const [topic, setTopic] = useState("");
  const [cards, setCards] = useState<DebateCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic to generate debate cards.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setCards([]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-debate-cards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ topic }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate debate cards");
      }

      const data = await response.json();
      
      if (data.cards && Array.isArray(data.cards)) {
        setCards(data.cards);
        toast({
          title: "Success!",
          description: `Generated ${data.cards.length} debate cards for "${topic}"`,
        });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error generating debate cards:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate debate cards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent mb-4">
            <MessageSquare className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight">
            Debate Card Generator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enter any topic and let AI generate three compelling debate cards with evidence, citations, and sources.
          </p>
        </div>

        {/* Input Form */}
        <form 
          onSubmit={handleSubmit} 
          className="max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4"
        >
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Enter a debate topic (e.g., 'renewable energy', 'space exploration')"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="flex-1 h-12 text-base"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="lg"
              disabled={isLoading}
              className="px-8 h-12 font-semibold"
            >
              {isLoading ? "Generating..." : "Generate"}
            </Button>
          </div>
        </form>

        {/* Loading State */}
        {isLoading && <LoadingSpinner />}

        {/* Results */}
        {!isLoading && cards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card, index) => (
              <DebateCard
                key={index}
                tagline={card.tagline}
                evidence={card.evidence}
                citation={card.citation}
                link={card.link}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && cards.length === 0 && (
          <div className="text-center py-12 animate-in fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
              <MessageSquare className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">
              Enter a topic above to generate debate cards
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
