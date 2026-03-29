import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// AuraPractice already reads ?tab= from URL search params,
// so linking from GameDashboard with ?tab=rpg works automatically.
// It also renders its own Header/Footer.
const AuraPractice = lazy(() => import("@/pages/student/AuraPractice"));

const GamePlay = () => {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <AuraPractice />
      </Suspense>
    </div>
  );
};

export default GamePlay;
