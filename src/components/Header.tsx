import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { StudentNotificationBell } from "@/components/student/StudentNotificationBell";
import { SettingsMenu } from "@/components/SettingsMenu";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { useLanguage } from "@/contexts/LanguageContext";

interface HeaderProps {
  showAuthButtons?: boolean;
  onSignOut?: () => void;
  children?: ReactNode;
  studentId?: string;
}

export const Header = ({ showAuthButtons = true, onSignOut, children, studentId }: HeaderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        // Fetch user role
        supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            setUserRole(data?.role || null);
          });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            setUserRole(data?.role || null);
          });
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut();
    } else {
      try {
        await supabase.auth.signOut();
        navigate("/auth", { replace: true });
      } catch (error) {
        console.error("Sign out error:", error);
        navigate("/auth", { replace: true });
      }
    }
  };

  const getDashboardPath = () => {
    switch (userRole) {
      case "teacher":
        return "/teacher/dashboard";
      case "parent":
        return "/parent/dashboard";
      case "admin":
        return "/admin/dashboard";
      case "district_admin":
        return "/district/dashboard";
      default:
        return "/student/dashboard";
    }
  };

  // Determine what to show based on auth state
  // Show auth buttons immediately while loading (null) or when definitively not authenticated
  const shouldShowAuthButtons = showAuthButtons && (isAuthenticated === null || isAuthenticated === false);
  const shouldShowSignOut = isAuthenticated === true;

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 group transition-all hover:opacity-80"
            aria-label="Go to homepage"
          >
            <div className="rounded-lg bg-gradient-hero group-hover:scale-110 transition-transform overflow-hidden">
              <img 
                src={logo} 
                alt="ImpressMe Kids Logo" 
                className="h-10 w-10 object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
                ImpressMe Kids
              </h1>
              <p className="text-xs text-muted-foreground">An ImpressMe Family App</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-2">
            {children}
            
            {/* Settings Menu (Theme + Language) */}
            <SettingsMenu />
            
            {/* Show notification bell for students */}
            {studentId && <StudentNotificationBell studentId={studentId} />}
            
            {/* Show Home button for authenticated users */}
            {shouldShowSignOut && (
              <Button variant="ghost" size="icon" asChild>
                <Link to={getDashboardPath()} aria-label="Go to dashboard">
                  <Home className="h-5 w-5" />
                </Link>
              </Button>
            )}
            
            {/* Only show auth buttons when NOT logged in */}
            {shouldShowAuthButtons && (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">{t('nav.signIn')}</Link>
                </Button>
                <Button className="bg-gradient-primary hover:opacity-90" asChild>
                  <Link to="/auth">{t('nav.getStarted')}</Link>
                </Button>
              </>
            )}
            
            {/* Show Sign Out button when logged in */}
            {shouldShowSignOut && (
              <Button variant="outline" onClick={handleSignOut}>
                {t('nav.signOut')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
