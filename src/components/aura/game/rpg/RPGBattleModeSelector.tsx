import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sword, Anchor, Sparkles, X, Users, Swords } from "lucide-react";

export type BattleMode = 'classic' | 'tug_of_war' | 'balloon' | 'pvp' | 'coop';

interface RPGBattleModeSelectorProps {
  onSelectMode: (mode: BattleMode) => void;
  onCancel: () => void;
}

const battleModes = [
  {
    id: 'classic' as BattleMode,
    name: 'Classic LexiQuest Battle',
    description: 'Traditional HP-based combat with mini-games and special attacks',
    icon: Sword,
    gradient: 'from-red-600 to-orange-500',
    bgGradient: 'from-red-900/30 to-orange-900/30',
  },
  {
    id: 'tug_of_war' as BattleMode,
    name: 'Tug of War Challenge',
    description: 'Pull the rope with reading accuracy - every word counts!',
    icon: Anchor,
    gradient: 'from-blue-600 to-cyan-500',
    bgGradient: 'from-blue-900/30 to-cyan-900/30',
  },
  {
    id: 'balloon' as BattleMode,
    name: 'Balloon Bonanza',
    description: 'Pop enemy balloons with correct words before yours pop!',
    icon: Sparkles,
    gradient: 'from-purple-600 to-pink-500',
    bgGradient: 'from-purple-900/30 to-pink-900/30',
  },
  {
    id: 'pvp' as BattleMode,
    name: 'Parent vs Kid PvP',
    description: 'Parent controls the enemy! Asymmetric competitive reading battle!',
    icon: Swords,
    gradient: 'from-red-600 to-rose-500',
    bgGradient: 'from-red-900/30 to-rose-900/30',
  },
  {
    id: 'coop' as BattleMode,
    name: 'Co-op Team Battle',
    description: 'Two heroes team up to defeat the enemy together!',
    icon: Users,
    gradient: 'from-blue-600 to-purple-500',
    bgGradient: 'from-blue-900/30 to-purple-900/30',
  },
];

export const RPGBattleModeSelector = ({
  onSelectMode,
  onCancel,
}: RPGBattleModeSelectorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black text-white">Choose Your Battle Style</h2>
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-white hover:bg-white/10">
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {battleModes.map((mode, index) => {
            const Icon = mode.icon;
            
            return (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  onClick={() => onSelectMode(mode.id)}
                  className={`relative overflow-hidden cursor-pointer transition-all duration-300 
                    hover:scale-105 hover:shadow-2xl border-2 border-transparent
                    hover:border-white/30 bg-gradient-to-br ${mode.bgGradient} p-6 h-full`}
                >
                  {/* Glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-10`} />
                  
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${mode.gradient} 
                    flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${mode.gradient} mb-2`}>
                    {mode.name}
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {mode.description}
                  </p>

                  {/* Classic badge */}
                  {mode.id === 'classic' && (
                    <div className="absolute top-3 right-3 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                      RECOMMENDED
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Footer hint */}
        <p className="text-center text-slate-400 mt-6 text-sm">
          All modes use the same story words and track your reading progress
        </p>
      </motion.div>
    </motion.div>
  );
};
