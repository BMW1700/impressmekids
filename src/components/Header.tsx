import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Home } from "lucide-react";
import { ReactNode } from "react";

interface HeaderProps {
  showAuthButtons?: boolean;
  onSignOut?: () => void;
  children?: ReactNode;
}

export const Header = ({ showAuthButtons = true, onSignOut, children }: HeaderProps) => {
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
          
          <div className="flex items-center gap-2">
            {children}
            
            {showAuthButtons && (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button className="bg-gradient-primary hover:opacity-90" asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
            
            {onSignOut && (
              <Button variant="outline" onClick={onSignOut}>
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
