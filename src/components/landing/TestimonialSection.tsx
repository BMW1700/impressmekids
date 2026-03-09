import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Play, BookOpen, Shield, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const TestimonialSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 px-4 py-2 bg-gradient-primary text-white border-none">
              See It In Action
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Experience What Makes Us Different
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Try our interactive demos — no sign-up required. See the AI reading assessment, RPG campaign, and classroom tools for yourself.
            </p>
          </div>

          {/* Demo Video Placeholder */}
          <div className="relative rounded-2xl overflow-hidden bg-muted border-2 border-border mb-12 aspect-video flex items-center justify-center group hover:border-primary transition-colors cursor-pointer">
            <div className="text-center">
              <div className="inline-flex p-6 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <Play className="h-12 w-12 text-primary" />
              </div>
              <p className="text-lg font-semibold text-foreground">Product Demo Coming Soon</p>
              <p className="text-sm text-muted-foreground mt-1">Try the interactive demos below in the meantime</p>
            </div>
          </div>

          {/* Value Props Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="text-center p-6 rounded-xl bg-card border border-border">
              <BookOpen className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-bold text-foreground mb-2">AURA Reading Assessment</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered fluency analysis that replaces expensive standardized tests — at $0/student
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-card border border-border">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-bold text-foreground mb-2">RPG Reading Campaign</h3>
              <p className="text-sm text-muted-foreground">
                Students defeat enemies by reading aloud — turning literacy practice into an adventure
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-card border border-border">
              <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-bold text-foreground mb-2">SSVRS Safety System</h3>
              <p className="text-sm text-muted-foreground">
                The only literacy platform with an integrated student safety & violence risk screening system
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6" asChild>
                <Link to="/demos">
                  Try Interactive Demos
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                <Link to="/auth">
                  Request a Pilot Program
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required • Free for up to 30 students • Setup in minutes
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
