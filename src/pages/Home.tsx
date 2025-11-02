import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, FileText, Copy, Zap } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/.15),transparent_50%),radial-gradient(circle_at_70%_60%,hsl(var(--accent)/.12),transparent_50%),radial-gradient(circle_at_50%_50%,hsl(var(--secondary)/.08),transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        
        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Powered by advanced AI</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
              Debate Research,
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Supercharged
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Generate professionally formatted debate cards with citations and evidence in seconds. 
              Cut prep time, win more rounds.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/generator">
                <Button size="lg" className="rainbow-hover h-14 px-8 text-lg font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary via-accent to-secondary">
                  Start Generating
                  <Sparkles className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background" />
        <div className="container relative mx-auto px-4">
          <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl md:text-4xl font-bold">
              Everything you need for competitive debate
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Professional-grade tools that transform how debaters research and prepare
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2 hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 group animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              <CardContent className="pt-8 space-y-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold">AI-Powered Evidence</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Advanced AI analyzes thousands of sources to find the most compelling evidence 
                  for your arguments, with proper highlighting and formatting.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent/50 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 group animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              <CardContent className="pt-8 space-y-4">
                <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <FileText className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-2xl font-semibold">Tournament-Ready Format</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Cards formatted to competition standards with proper citations, author credentials, 
                  and strategic highlighting that reads naturally in round.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-secondary/50 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 group animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
              <CardContent className="pt-8 space-y-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Copy className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold">One-Click Copy</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Copy cards with formatting intact—highlighting, bold, and underline preserved 
                  perfectly for Google Docs, Word, or any document editor.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                From topic to tournament card in 3 steps
              </h2>
            </div>

            <div className="space-y-8">
              <div className="flex gap-6 items-start group">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                  1
                </div>
                <div className="space-y-2 pt-1">
                  <h3 className="text-xl font-semibold">Enter your topic</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Type any debate topic or argument you're researching—from "renewable energy" 
                    to complex policy positions.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start group">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                  2
                </div>
                <div className="space-y-2 pt-1">
                  <h3 className="text-xl font-semibold">AI generates evidence</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Our AI analyzes credible sources and creates three debate cards with strategic 
                    highlighting, author credentials, and verified citations.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start group">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                  3
                </div>
                <div className="space-y-2 pt-1">
                  <h3 className="text-xl font-semibold">Copy and compete</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    One click copies your card with perfect formatting. Paste directly into your 
                    case and you're ready for competition.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link to="/generator">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold border-2">
                  Try it now
                  <Zap className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground">
            Built for debaters who value precision and speed
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
