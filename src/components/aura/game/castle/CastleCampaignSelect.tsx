import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Castle, Infinity as InfinityIcon, Calendar, Lock, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useCastleCampaign } from "@/hooks/useCastleCampaign";
import { getCampaignLevels, CampaignLevel } from "./campaignLevels";
import { getStoredTheme, getGradeMode } from "@/lib/gameTheme";
import { dailySeedString } from "./WaveDirector";
import { CastleUpgradesPanel } from "./CastleUpgradesPanel";

interface Props {
  onPickEndless: () => void;
  onPickDaily: (seed: string) => void;
  onPickCampaign: (level: CampaignLevel) => void;
  onBack: () => void;
}

export const CastleCampaignSelect = ({ onPickEndless, onPickDaily, onPickCampaign, onBack }: Props) => {
  const gradeMode = getGradeMode(getStoredTheme());
  const levels = getCampaignLevels(gradeMode);
  const { byLevel, isUnlocked, endlessUnlocked } = useCastleCampaign();
  const levelIds = levels.map(l => l.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-rose-950 text-white p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="text-white">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-black text-rose-300">Castle Swarm Defense</h1>
          <div className="w-16" />
        </div>

        {/* Mode tiles */}
        <div className="grid sm:grid-cols-2 gap-3">
          <Card className={`p-4 bg-gradient-to-br from-rose-700/30 to-slate-700/30 border-rose-500/40 ${endlessUnlocked ? "cursor-pointer hover:scale-[1.02]" : "opacity-60"} transition`}
            onClick={() => endlessUnlocked && onPickEndless()}>
            <div className="flex items-center gap-3">
              <InfinityIcon className="w-8 h-8 text-rose-300" />
              <div className="flex-1">
                <div className="font-bold text-lg">Endless</div>
                <div className="text-xs text-slate-300">Survive as long as you can.</div>
              </div>
              {!endlessUnlocked && <Lock className="w-5 h-5 text-slate-400" />}
            </div>
            {!endlessUnlocked && (
              <div className="text-[11px] text-slate-400 mt-2">Clear 5 campaign levels to unlock.</div>
            )}
          </Card>
          <Card className="p-4 bg-gradient-to-br from-cyan-600/30 to-violet-600/30 border-cyan-500/40 cursor-pointer hover:scale-[1.02] transition"
            onClick={() => onPickDaily(dailySeedString())}>
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-cyan-300" />
              <div className="flex-1">
                <div className="font-bold text-lg">Daily Challenge</div>
                <div className="text-xs text-slate-300">Same waves for every player today.</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Upgrades */}
        <CastleUpgradesPanel />

        {/* Campaign levels */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Castle className="w-5 h-5 text-amber-300" />
            <h2 className="text-lg font-bold">Campaign · {gradeMode === "6to12" ? "Operative" : "Hero"}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {levels.map((lvl, i) => {
              const prog = byLevel.get(lvl.id);
              const unlocked = isUnlocked(levelIds, lvl.id);
              return (
                <motion.div key={lvl.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card
                    onClick={() => unlocked && onPickCampaign(lvl)}
                    className={`p-3 border ${unlocked ? "cursor-pointer hover:scale-[1.03] bg-slate-800/80 border-slate-600" : "bg-slate-900/60 border-slate-800 opacity-60"} transition`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Level {i + 1}</span>
                      {!unlocked && <Lock className="w-3 h-3 text-slate-500" />}
                    </div>
                    <div className="font-bold text-sm mt-1">{lvl.name}</div>
                    <div className="text-[10px] text-slate-400 leading-snug line-clamp-2 mt-0.5 min-h-[24px]">{lvl.description}</div>
                    <div className="flex items-center gap-0.5 mt-2">
                      {[1, 2, 3].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= (prog?.stars ?? 0) ? "fill-amber-400 text-amber-400" : "text-slate-700"}`} />
                      ))}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
