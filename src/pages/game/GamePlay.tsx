import { useSearchParams } from "react-router-dom";
import { GameHeader } from "@/components/game/GameHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useCampaignProgress } from "@/hooks/useCampaignProgress";
import { RPGPlayerHUD } from "@/components/aura/game/rpg/RPGPlayerHUD";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Reuse the existing AuraPractice component - it already handles everything
const AuraPractice = lazy(() => import("@/pages/student/AuraPractice"));

const GamePlay = () => {
  const { user } = useAuth();
  const { progress } = useCampaignProgress(user?.id);
  const [searchParams] = useSearchParams();

  const gold = progress?.total_gold ?? 0;
  const xp = progress?.total_xp_earned ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Override the header with GameHeader - AuraPractice will render its own header too,
          but we wrap it to provide game context */}
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
