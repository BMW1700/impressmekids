import { Button } from "@/components/ui/button";
import { Coins, Heart, Sword, Users, Lock } from "lucide-react";
import { useCastleUpgrades, upgradeCost, UpgradeTrack } from "@/hooks/useCastleUpgrades";
import { useCampaignProgress } from "@/hooks/useCampaignProgress";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredTheme, getGradeMode } from "@/lib/gameTheme";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const TRACK_META: Record<UpgradeTrack, { label: string; description: string; icon: typeof Heart; color: string }> = {
  hp_level:     { label: "Knight HP",      description: "+1 HP per knight per level", icon: Heart, color: "text-rose-400" },
  damage_level: { label: "Knight Damage",  description: "+0.6 DPS per level",         icon: Sword, color: "text-amber-400" },
  cap_level:    { label: "Summon Cap",     description: "+1 max active knight",       icon: Users, color: "text-cyan-400" },
};

export const CastleUpgradesPanel = () => {
  const { user } = useAuth();
  const gradeMode = getGradeMode(getStoredTheme());
  const { upgrades, buy } = useCastleUpgrades();
  const { progress } = useCampaignProgress(user?.id, gradeMode);
  const { toast } = useToast();
  const [busy, setBusy] = useState<UpgradeTrack | null>(null);
  const coins = progress?.total_gold ?? 0;

  const handleBuy = async (track: UpgradeTrack) => {
    const cost = upgradeCost(upgrades[track] as number);
    if (!cost || coins < cost || !user?.id || busy) return;
    setBusy(track);
    try {
      const result = await buy({ track, cost });
      toast({
        title: "Upgrade purchased!",
        description: `${TRACK_META[track].label} → Lv ${result.new_level}. ${result.balance} 🪙 left.`,
      });
    } catch (e: any) {
      toast({
        title: "Purchase failed",
        description: e?.message || "Try again",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold">Knight Upgrades</h3>
        <div className="flex items-center gap-1 text-amber-300 font-bold text-sm">
          <Coins className="w-4 h-4" /> {coins.toLocaleString()}
        </div>
      </div>
      {(Object.keys(TRACK_META) as UpgradeTrack[]).map(track => {
        const meta = TRACK_META[track];
        const lvl = upgrades[track] as number;
        const cost = upgradeCost(lvl);
        const maxed = cost === null;
        const Icon = meta.icon;
        return (
          <div key={track} className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 flex items-center gap-3">
            <Icon className={`w-5 h-5 ${meta.color}`} />
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-semibold flex items-center gap-2">
                {meta.label} <span className="text-xs text-slate-400">Lv {lvl}/5</span>
              </div>
              <div className="text-[11px] text-slate-400">{meta.description}</div>
            </div>
            {maxed ? (
              <span className="text-xs text-emerald-300 font-bold">MAX</span>
            ) : (
              <Button size="sm" onClick={() => handleBuy(track)} disabled={busy === track || coins < cost!}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold disabled:bg-slate-700 disabled:text-slate-400">
                {coins < cost! && <Lock className="w-3 h-3 mr-1" />}
                {cost} 🪙
              </Button>
            )}
          </div>
        );
      })}
      <p className="text-[10px] text-slate-500 text-center pt-1">Coins from any reading mode count.</p>
    </div>
  );
};
