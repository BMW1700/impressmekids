import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Home } from "lucide-react";

interface HeaderProps {
  showAuthButtons?: boolean;
}

export const Header = ({ showAuthButtons = true }: HeaderProps) => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 group transition-all hover:opacity-80"
            aria-label="Go to homepage"
          >
            <div className="p-2 rounded-lg bg-gradient-hero group-hover:scale-110 transition-transform">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
                Impress Me Kids
              </h1>
              <p className="text-xs text-muted-foreground">An Impress Me Family App</p>
            </div>
          </Link>
          
          {showAuthButtons && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button className="bg-gradient-primary hover:opacity-90" asChild>
                <Link to="/auth">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
