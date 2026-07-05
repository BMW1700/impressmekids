import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gamepad2, BarChart3, LogOut, Home, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SettingsMenu } from "@/components/SettingsMenu";
import { ReactNode } from "react";

interface GameHeaderProps {
  children?: ReactNode;
  studentId?: string;
}

export const GameHeader = ({ children, studentId }: GameHeaderProps) => {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link to="/game/dashboard" className="flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-yellow-400" />
            <span className="font-bold text-lg">
              <span className="text-foreground">Yubi</span>
              <span className="text-yellow-400">Learn</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {children}

          <SettingsMenu />


          
          {session ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/game/analytics')}
                className="text-muted-foreground hover:text-foreground"
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">My Progress</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/', { state: { skipRedirect: true } })}
                className="text-muted-foreground hover:text-foreground"
              >
                <Home className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/', { state: { skipRedirect: true } })}
                className="text-muted-foreground hover:text-foreground"
              >
                <Home className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                onClick={() => navigate('/game/auth')}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                <LogIn className="w-4 h-4 mr-1" />
                Sign In
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
