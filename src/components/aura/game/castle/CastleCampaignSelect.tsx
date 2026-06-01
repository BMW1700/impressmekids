import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Castle, Infinity as InfinityIcon, Calendar, Lock, Star, Scroll, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { useCastleCampaign } from "@/hooks/useCastleCampaign";
import { getCampaignLevels, CampaignLevel, CASTLE_ARCS, CastleArcId } from "./campaignLevels";
import { getStoredTheme, getGradeMode } from "@/lib/gameTheme";
import { dailySeedString } from "./WaveDirector";
import { CastleUpgradesPanel } from "./CastleUpgradesPanel";
import { CastleLeaderboardPanel } from "./CastleLeaderboardPanel";

interface Props {
  onPickEndless: () => void;
  onPickDaily: (seed: string) => void;
  onPickCampaign: (level: CampaignLevel) => void;
  onBack: () => void;
}

const ARC_GRADIENT: Record<string, string> = {
  amber: "from-amber-900/40 via-orange-900/30 to-slate-900/60 border-amber-600/40",
  cyan: "from-cyan-900/40 via-sky-900/30 to-slate-900/60 border-cyan-500/40",
  violet: "from-violet-900/40 via-fuchsia-900/30 to-slate-900/60 border-violet-500/40",
  emerald: "from-emerald-900/50 via-teal-900/30 to-slate-900/60 border-emerald-500/40",
  rose: "from-rose-900/50 via-red-900/40 to-slate-900/70 border-rose-500/50",
};

const ARC_TEXT: Record<string, string> = {
  amber: "text-amber-200",
  cyan: "text-cyan-200",
  violet: "text-violet-200",
  emerald: "text-emerald-200",
  rose: "text-rose-200",
};

export const CastleCampaignSelect = ({ onPickEndless, onPickDaily, onPickCampaign, onBack }: Props) => {
  const gradeMode = getGradeMode(getStoredTheme());
  const levels = getCampaignLevels(gradeMode);
  const { byLevel, isUnlocked, endlessUnlocked } = useCastleCampaign();
  const levelIds = levels.map(l => l.id);

  // Split levels: legacy (no arc) + grouped arcs
  const legacyLevels = levels.filter(l => !l.arc);
  const arcGroups: { arc: typeof CASTLE_ARCS[CastleArcId]; levels: CampaignLevel[] }[] = [];
  (Object.keys(CASTLE_ARCS) as CastleArcId[]).forEach(arcId => {
    const arcLevels = levels.filter(l => l.arc === arcId);
    if (arcLevels.length) arcGroups.push({ arc: CASTLE_ARCS[arcId], levels: arcLevels });
  });

  const renderLevelCard = (lvl: CampaignLevel, indexInList: number) => {
    const prog = byLevel.get(lvl.id);
    const unlocked = isUnlocked(levelIds, lvl.id);
    return (
      <motion.div key={lvl.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: indexInList * 0.03 }}>
        <Card
          onClick={() => unlocked && onPickCampaign(lvl)}
          className={`p-3 border ${unlocked ? "cursor-pointer hover:scale-[1.03] bg-slate-800/80 border-slate-600" : "bg-slate-900/60 border-slate-800 opacity-60"} transition`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">{lvl.id}</span>
            {!unlocked && <Lock className="w-3 h-3 text-slate-500" />}
          </div>
          <div className="font-bold text-sm mt-1 leading-tight">{lvl.name}</div>
          <div className="text-[10px] text-slate-400 leading-snug line-clamp-2 mt-0.5 min-h-[24px]">{lvl.description}</div>
          <div className="flex items-center gap-0.5 mt-2">
            {[1, 2, 3].map(s => (
              <Star key={s} className={`w-3.5 h-3.5 ${s <= (prog?.stars ?? 0) ? "fill-amber-400 text-amber-400" : "text-slate-700"}`} />
            ))}
          </div>
        </Card>
      </motion.div>
    );
  };

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
                <div className="font-bold text-lg">Endless Siege</div>
                <div className="text-xs text-slate-300">Survive as long as you can. Read forever.</div>
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

        {/* Legacy campaign */}
        {legacyLevels.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Castle className="w-5 h-5 text-amber-300" />
              <h2 className="text-lg font-bold">Training Grounds · {gradeMode === "6to12" ? "Operative" : "Hero"}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {legacyLevels.map((lvl, i) => renderLevelCard(lvl, i))}
            </div>
          </div>
        )}

        {/* Story arcs */}
        {arcGroups.map(({ arc, levels: arcLevels }, gi) => {
          const gradient = ARC_GRADIENT[arc.bannerHue] || ARC_GRADIENT.amber;
          const text = ARC_TEXT[arc.bannerHue] || ARC_TEXT.amber;
          // Determine if arc is locked: first level of arc unlocked check
          const firstUnlocked = isUnlocked(levelIds, arcLevels[0].id);
          return (
            <motion.div
              key={arc.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + gi * 0.05 }}
            >
              <Card className={`p-4 bg-gradient-to-br ${gradient} border-2 mb-3`}>
                <div className="flex items-start gap-3">
                  {arc.id === "the_final_siege" ? (
                    <Crown className={`w-7 h-7 ${text} flex-shrink-0 mt-0.5`} />
                  ) : (
                    <Scroll className={`w-7 h-7 ${text} flex-shrink-0 mt-0.5`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className={`text-xl font-black ${text}`}>{arc.title}</h2>
                    <p className="text-xs italic text-slate-300 mt-0.5">{arc.subtitle}</p>
                    <p className="text-[12px] text-slate-200/90 leading-relaxed mt-2">
                      {firstUnlocked ? arc.intro : <span className="text-slate-400">Complete earlier missions to unlock this arc.</span>}
                    </p>
                  </div>
                </div>
              </Card>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-2">
                {arcLevels.map((lvl, i) => renderLevelCard(lvl, i))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
