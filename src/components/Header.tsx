import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HeaderProps {
  showAuthButtons?: boolean;
}

export const Header = ({ showAuthButtons = true }: HeaderProps) => {
  const navigate = useNavigate();
  const [dashboardPath, setDashboardPath] = useState("/");

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          if (profile.role === 'teacher') {
            setDashboardPath('/teacher-dashboard');
          } else if (profile.role === 'student') {
            setDashboardPath('/student-dashboard');
          } else if (profile.role === 'parent') {
            setDashboardPath('/parent-dashboard');
          }
        }
      }
    };
    
    checkUserRole();
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(dashboardPath);
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <a 
            href={dashboardPath}
            onClick={handleLogoClick}
            className="flex items-center gap-2 group transition-all hover:opacity-80 cursor-pointer"
            aria-label="Go to dashboard"
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
          </a>
          
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
