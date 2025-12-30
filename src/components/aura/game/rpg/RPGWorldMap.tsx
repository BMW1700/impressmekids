import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Lock, Star, Swords, Crown, TreePine, Mountain, Castle, Flame } from "lucide-react";
import { campaignWorlds, CampaignWorld } from "@/lib/campaignData";

interface WorldProgress {
  worldId: number;
  levelsCompleted: number;
  totalLevels: number;
  starsEarned: number;
  isUnlocked: boolean;
}

interface RPGWorldMapProps {
  worldProgress: WorldProgress[];
  totalBooksRescued: number;
  onSelectWorld: (world: CampaignWorld) => void;
  onBack: () => void;
}

const worldIcons: Record<number, React.ReactNode> = {
  1: <TreePine className="h-8 w-8" />,
  2: <Mountain className="h-8 w-8" />,
  3: <Flame className="h-8 w-8" />,
  4: <Crown className="h-8 w-8" />,
};

export const RPGWorldMap = ({
  worldProgress,
  totalBooksRescued,
  onSelectWorld,
  onBack,
}: RPGWorldMapProps) => {
  const getWorldProgress = (worldId: number): WorldProgress => {
    return worldProgress.find(p => p.worldId === worldId) || {
      worldId,
      levelsCompleted: 0,
      totalLevels: 5,
      starsEarned: 0,
      isUnlocked: worldId === 1,
    };
  };

  const isWorldUnlocked = (world: CampaignWorld): boolean => {
    if (world.id === 1) return true;
    const prevWorld = getWorldProgress(world.id - 1);
    return prevWorld.levelsCompleted >= world.unlockRequirement;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-amber-900/60 px-4 py-2 rounded-full border border-amber-500/50">
            <span className="text-2xl">📚</span>
            <span className="text-amber-300 font-bold">{totalBooksRescued} Books Rescued</span>
          </div>
        </div>
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500 mb-2">
          🗺️ World Map
        </h1>
        <p className="text-purple-300 text-lg">Choose your adventure!</p>
      </motion.div>

      {/* World Cards */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaignWorlds.map((world, index) => {
          const progress = getWorldProgress(world.id);
          const unlocked = isWorldUnlocked(world);
          const completionPercent = progress.totalLevels > 0 
            ? (progress.levelsCompleted / progress.totalLevels) * 100 
            : 0;

          return (
            <motion.div
              key={world.id}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
            >
              <Card
                className={`relative overflow-hidden cursor-pointer transition-all duration-300
                  ${unlocked 
                    ? 'hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30' 
                    : 'opacity-60 cursor-not-allowed grayscale'
                  }
                  border-2 ${unlocked ? 'border-purple-500/50' : 'border-slate-600'}`}
                onClick={() => unlocked && onSelectWorld(world)}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${world.gradient} opacity-20`} />
                
                {/* Lock Overlay */}
                {!unlocked && (
                  <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center z-10">
                    <div className="text-center">
                      <Lock className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">
                        Complete {world.unlockRequirement} stories in previous world
                      </p>
                    </div>
                  </div>
                )}

                <div className="relative p-6 z-5">
                  {/* World Icon & Number */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${world.gradient} text-white shadow-lg`}>
                      {worldIcons[world.id] || <Swords className="h-8 w-8" />}
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-purple-300">World</span>
                      <div className="text-3xl font-black text-white">{world.id}</div>
                    </div>
                  </div>

                  {/* World Name */}
                  <h3 className={`text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r ${world.gradient}`}>
                    {world.name}
                  </h3>
                  <p className="text-slate-300 text-sm mb-4">{world.description}</p>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Progress</span>
                      <span>{progress.levelsCompleted}/{progress.totalLevels} Levels</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPercent}%` }}
                        transition={{ delay: index * 0.15 + 0.3, duration: 0.5 }}
                        className={`h-full bg-gradient-to-r ${world.gradient}`}
                      />
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(3)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(progress.starsEarned / progress.totalLevels)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-slate-400 text-sm">{progress.starsEarned} stars</span>
                  </div>

                  {/* Boss Indicator */}
                  {world.id === 4 && (
                    <div className="mt-4 flex items-center gap-2 bg-red-900/50 px-3 py-2 rounded-lg border border-red-500/50">
                      <Crown className="h-5 w-5 text-red-400" />
                      <span className="text-red-300 font-bold text-sm">FINAL BOSS: Grog the Goblin King!</span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Lore */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-center"
      >
        <p className="text-purple-400 italic max-w-2xl mx-auto">
          "Princess Ella's books are scattered across four worlds. 
          Defeat Grog's minions, rescue the books, and restore magic to the kingdom!"
        </p>
      </motion.div>
    </div>
  );
};