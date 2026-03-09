import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { ReactNode } from "react";
import { StudentNotificationBell } from "@/components/student/StudentNotificationBell";
import { SettingsMenu } from "@/components/SettingsMenu";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";
import { useLanguage } from "@/contexts/LanguageContext";

interface HeaderProps {
  showAuthButtons?: boolean;
  onSignOut?: () => void;
  children?: ReactNode;
  studentId?: string;
}

export const Header = ({ showAuthButtons = true, onSignOut, children, studentId }: HeaderProps) => {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut();
    } else {
      await signOut();
      navigate("/auth", { replace: true });
    }
  };

  const getDashboardPath = () => {
    switch (profile?.role) {
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

  const isAuthenticated = !!session;
  const shouldShowAuthButtons = showAuthButtons && !isAuthenticated;
  const shouldShowSignOut = isAuthenticated;

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
                  <Link to="/pricing">Pricing</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/auth">{t('nav.signIn')}</Link>
                </Button>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 hidden sm:inline-flex" asChild>
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
