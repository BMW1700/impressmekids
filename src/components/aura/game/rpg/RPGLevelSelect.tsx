import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Star, Lock, Swords, Flame, Crown, BookOpen } from "lucide-react";
import { CampaignWorld } from "@/lib/campaignData";
import { CuratedStory } from "@/data/curatedStories";
import { RPGBattleModeSelector, BattleMode } from "./RPGBattleModeSelector";

// All possible enemy types in the campaign
export type CampaignEnemyType = 
  | 'minion' | 'guard' | 'elite' | 'boss' | 'dragon'
  | 'ice_golem' | 'shadow_wraith' | 'stone_guardian'
  | 'cave_troll' | 'crystal_spider' | 'echo_wraith'
  | 'storm_harpy' | 'cloud_giant' | 'zephyr'
  | 'ink_kraken' | 'reef_guardian' | 'leviathan'
  | 'void_phantom' | 'reality_shifter' | 'word_eater';

export interface CampaignLevel {
  id: number;
  story: CuratedStory;
  enemies: CampaignEnemyType[];
  isBossLevel: boolean;
  starsEarned: number;
  isCompleted: boolean;
  isUnlocked: boolean;
}

interface RPGLevelSelectProps {
  world: CampaignWorld;
  levels: CampaignLevel[];
  onSelectLevel: (level: CampaignLevel, battleMode: BattleMode) => void;
  onBack: () => void;
}

const enemyIcons: Record<string, React.ReactNode> = {
  minion: <span className="text-lg">👺</span>,
  guard: <span className="text-lg">⚔️</span>,
  elite: <span className="text-lg">🛡️</span>,
  boss: <span className="text-lg">👑</span>,
  dragon: <span className="text-lg">🐉</span>,
  ice_golem: <span className="text-lg">🧊</span>,
  shadow_wraith: <span className="text-lg">👻</span>,
  stone_guardian: <span className="text-lg">🗿</span>,
  // World 5 - Caverns
  cave_troll: <span className="text-lg">🧌</span>,
  crystal_spider: <span className="text-lg">🕷️</span>,
  echo_wraith: <span className="text-lg">🔮</span>,
  // World 6 - Sky
  storm_harpy: <span className="text-lg">🦅</span>,
  cloud_giant: <span className="text-lg">☁️</span>,
  zephyr: <span className="text-lg">🌪️</span>,
  // World 7 - Ocean
  ink_kraken: <span className="text-lg">🦑</span>,
  reef_guardian: <span className="text-lg">🐚</span>,
  leviathan: <span className="text-lg">🐋</span>,
  // World 8 - Void
  void_phantom: <span className="text-lg">💀</span>,
  reality_shifter: <span className="text-lg">🌀</span>,
  word_eater: <span className="text-lg">👁️</span>,
};

export const RPGLevelSelect = ({
  world,
  levels,
  onSelectLevel,
  onBack,
}: RPGLevelSelectProps) => {
  const [pendingLevel, setPendingLevel] = useState<CampaignLevel | null>(null);
  const [showModeSelector, setShowModeSelector] = useState(false);

  const handleLevelClick = (level: CampaignLevel) => {
    setPendingLevel(level);
    setShowModeSelector(true);
  };

  const handleModeSelect = (mode: BattleMode) => {
    if (pendingLevel) {
      onSelectLevel(pendingLevel, mode);
    }
    setShowModeSelector(false);
    setPendingLevel(null);
  };

  const handleCancelMode = () => {
    setShowModeSelector(false);
    setPendingLevel(null);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-4`}>
      {/* Mode Selector Modal */}
      <AnimatePresence>
        {showModeSelector && (
          <RPGBattleModeSelector
            onSelectMode={handleModeSelect}
            onCancel={handleCancelMode}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10">
          <ArrowLeft className="h-4 w-4 mr-2" />
          World Map
        </Button>
      </div>

      {/* World Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className={`inline-block px-4 py-1 rounded-full bg-gradient-to-r ${world.gradient} text-white text-sm font-bold mb-2`}>
          World {world.id}
        </div>
        <h1 className={`text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r ${world.gradient} mb-2`}>
          {world.name}
        </h1>
        <p className="text-slate-400">{world.lore}</p>
      </motion.div>

      {/* Levels Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {levels.map((level, index) => {
          const isUnlocked = level.isUnlocked;
          
          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`relative overflow-hidden cursor-pointer transition-all duration-300
                  ${isUnlocked 
                    ? 'hover:scale-105 hover:shadow-xl' 
                    : 'opacity-50 cursor-not-allowed'
                  }
                  ${level.isBossLevel 
                    ? 'border-2 border-red-500/50 shadow-red-500/20' 
                    : 'border border-slate-700'
                  }
                  ${level.isCompleted ? 'bg-green-900/20' : 'bg-slate-800/50'}`}
                onClick={() => isUnlocked && handleLevelClick(level)}
              >
                {/* Lock Overlay */}
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-10">
                    <Lock className="h-8 w-8 text-slate-500" />
                  </div>
                )}

                {/* Boss Badge */}
                {level.isBossLevel && (
                  <div className="absolute top-2 right-2 z-5">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1"
                    >
                      <Crown className="h-3 w-3" />
                      BOSS
                    </motion.div>
                  </div>
                )}

                <div className="p-4">
                  {/* Level Number */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg
                      ${level.isCompleted 
                        ? 'bg-green-600 text-white' 
                        : `bg-gradient-to-br ${world.gradient} text-white`
                      }`}>
                      {level.isCompleted ? '✓' : level.id}
                    </div>
                    
                    {/* Stars */}
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= level.starsEarned
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Story Title */}
                  <h3 className="font-bold text-white mb-1 line-clamp-1">
                    {level.story.title}
                  </h3>
                  
                  {/* Story Info */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                    <BookOpen className="h-3 w-3" />
                    <span>{level.story.word_count} words</span>
                    <span>•</span>
                    <span>Grade {level.story.grade_level}</span>
                  </div>

                  {/* Enemies */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Enemies:</span>
                    <div className="flex gap-1">
                      {level.enemies.map((enemy, i) => (
                        <div
                          key={i}
                          className="w-7 h-7 rounded bg-slate-700/50 flex items-center justify-center"
                          title={enemy}
                        >
                          {enemyIcons[enemy]}
                        </div>
                      ))}
                    </div>
                    {level.enemies.length > 1 && (
                      <span className="text-xs text-orange-400 font-bold">MULTI!</span>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* World Progress Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <div className="inline-flex items-center gap-4 bg-slate-800/50 px-6 py-3 rounded-full">
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-purple-400" />
            <span className="text-slate-300">
              {levels.filter(l => l.isCompleted).length}/{levels.length} Complete
            </span>
          </div>
          <div className="w-px h-6 bg-slate-600" />
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            <span className="text-slate-300">
              {levels.reduce((sum, l) => sum + l.starsEarned, 0)} Stars
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};