import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Skull, Crown, Shield, Sword, Snowflake, Ghost, Mountain, Bug, Bird, Cloud, Waves, Anchor, Eye, Sparkles } from "lucide-react";
import { type EnemyType } from "@/lib/battleMechanics";

export type GrogState = 'idle' | 'hit' | 'attacking' | 'defeated' | 'taunting';

interface GrogCharacterProps {
  state: GrogState;
  enemyType: EnemyType;
  healthPercent: number;
  worldNumber?: number;
  showDamage?: number;
  taunt?: string;
  avatarUrl?: string;
}

// Get tier for sizing
const getEnemyTier = (enemyType: EnemyType): 'minion' | 'guard' | 'elite' | 'boss' => {
  const tierMap: Partial<Record<EnemyType, 'minion' | 'guard' | 'elite' | 'boss'>> = {
    boss: 'boss', dragon: 'boss', stone_guardian: 'boss', zephyr: 'boss', leviathan: 'boss', word_eater: 'boss',
    elite: 'elite', ice_golem: 'elite', echo_wraith: 'elite', cloud_giant: 'elite', reef_guardian: 'elite', reality_shifter: 'elite',
    guard: 'guard', shadow_wraith: 'guard', cave_troll: 'guard', ink_kraken: 'guard', void_phantom: 'guard',
    minion: 'minion', crystal_spider: 'minion', storm_harpy: 'minion',
  };
  return tierMap[enemyType] || 'minion';
};

// Get icon and colors for enemy
const getEnemyConfig = (enemyType: EnemyType): { icon: React.ElementType; gradient: string; name: string } => {
  const configs: Partial<Record<EnemyType, { icon: React.ElementType; gradient: string; name: string }>> = {
    minion: { icon: Skull, gradient: 'from-green-500 to-emerald-600', name: 'Goblin Minion' },
    guard: { icon: Shield, gradient: 'from-purple-500 to-indigo-600', name: 'Goblin Guard' },
    elite: { icon: Sword, gradient: 'from-red-500 to-rose-600', name: 'Elite Warrior' },
    boss: { icon: Crown, gradient: 'from-yellow-400 via-amber-500 to-orange-600', name: 'Grog the Goblin King' },
    dragon: { icon: Sparkles, gradient: 'from-orange-500 to-red-600', name: 'Drake the Dragon' },
    ice_golem: { icon: Snowflake, gradient: 'from-cyan-400 to-blue-600', name: 'Frostfang' },
    shadow_wraith: { icon: Ghost, gradient: 'from-purple-800 to-slate-900', name: 'Shadow Wraith' },
    stone_guardian: { icon: Mountain, gradient: 'from-stone-500 to-stone-700', name: 'Stone Guardian' },
    cave_troll: { icon: Mountain, gradient: 'from-stone-600 to-slate-700', name: 'Cave Troll' },
    crystal_spider: { icon: Bug, gradient: 'from-violet-400 to-pink-500', name: 'Crystal Spider' },
    echo_wraith: { icon: Ghost, gradient: 'from-violet-600 to-purple-800', name: 'Echo Wraith' },
    storm_harpy: { icon: Bird, gradient: 'from-sky-400 to-blue-600', name: 'Storm Harpy' },
    cloud_giant: { icon: Cloud, gradient: 'from-blue-300 to-indigo-500', name: 'Cloud Giant' },
    zephyr: { icon: Sparkles, gradient: 'from-cyan-400 to-teal-600', name: 'Zephyr' },
    ink_kraken: { icon: Waves, gradient: 'from-teal-700 to-blue-900', name: 'Ink Kraken' },
    reef_guardian: { icon: Anchor, gradient: 'from-cyan-500 to-teal-700', name: 'Reef Guardian' },
    leviathan: { icon: Waves, gradient: 'from-blue-800 to-slate-900', name: 'Leviathan' },
    void_phantom: { icon: Ghost, gradient: 'from-purple-900 to-black', name: 'Void Phantom' },
    reality_shifter: { icon: Sparkles, gradient: 'from-violet-600 to-purple-900', name: 'Reality Shifter' },
    word_eater: { icon: Eye, gradient: 'from-black via-purple-900 to-black', name: 'Word Eater' },
  };
  return configs[enemyType] || { icon: Skull, gradient: 'from-green-500 to-emerald-600', name: 'Unknown Enemy' };
};

const tierSizes: Record<'minion' | 'guard' | 'elite' | 'boss', string> = {
  minion: 'w-16 h-16',
  guard: 'w-20 h-20', 
  elite: 'w-24 h-24',
  boss: 'w-28 h-28',
};

export const GrogCharacter = ({
  state,
  enemyType,
  healthPercent,
  worldNumber = 1,
  showDamage,
  taunt,
  avatarUrl,
}: GrogCharacterProps) => {
  const [damageNumbers, setDamageNumbers] = useState<{ id: number; value: number }[]>([]);
  const tier = getEnemyTier(enemyType);
  const config = getEnemyConfig(enemyType);
  const Icon = config.icon;

  // Add damage number when showDamage changes
  useEffect(() => {
    if (showDamage && showDamage > 0) {
      const id = Date.now();
      setDamageNumbers(prev => [...prev, { id, value: showDamage }]);
      
      // Remove after animation
      setTimeout(() => {
        setDamageNumbers(prev => prev.filter(d => d.id !== id));
      }, 1000);
    }
  }, [showDamage]);

  // Get animation based on state
  const getAnimation = () => {
    switch (state) {
      case 'hit':
        return { x: [-10, 10, -10, 10, 0], scale: [1, 0.9, 1] };
      case 'attacking':
        return { scale: [1, 1.2, 1], rotate: [-5, 5, -5, 0] };
      case 'defeated':
        return { rotate: 90, opacity: 0, y: 50 };
      case 'taunting':
        return { scale: [1, 1.1, 1] };
      default:
        return { y: [0, -5, 0] };
    }
  };

  return (
    <div className="relative flex flex-col items-center gap-3">
      {/* Enemy Name */}
      <div className="text-sm font-bold text-foreground/80">
        {config.name}
      </div>

      {/* Main Character Container */}
      <motion.div
        className="relative"
        animate={getAnimation()}
        transition={{ duration: state === 'idle' ? 2 : 0.3, repeat: state === 'idle' ? Infinity : 0 }}
      >
        {/* Glow effect */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-r ${config.gradient} rounded-full blur-xl opacity-50`}
          animate={{
            opacity: state === 'attacking' ? 0.8 : 0.3,
            scale: state === 'attacking' ? 1.3 : 1,
          }}
        />

        {/* Character Circle */}
        <div
          className={`relative ${tierSizes[tier]} rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg border-4 border-background overflow-hidden`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Enemy avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <>
              <Icon className={`${tier === 'boss' ? 'w-14 h-14' : tier === 'elite' ? 'w-12 h-12' : tier === 'guard' ? 'w-10 h-10' : 'w-8 h-8'} text-white`} />
              
              {/* Eyes for character */}
              <div className="absolute top-1/4 left-1/4 flex gap-1">
                <motion.div
                  className="w-2 h-2 bg-yellow-300 rounded-full"
                  animate={{
                    scale: state === 'attacking' ? [1, 1.5, 1] : 1,
                  }}
                />
                <motion.div
                  className="w-2 h-2 bg-yellow-300 rounded-full"
                  animate={{
                    scale: state === 'attacking' ? [1, 1.5, 1] : 1,
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Hit flash effect */}
        <AnimatePresence>
          {state === 'hit' && (
            <motion.div
              className="absolute inset-0 bg-white rounded-full"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Damage Numbers */}
      <AnimatePresence>
        {damageNumbers.map(({ id, value }) => (
          <motion.div
            key={id}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 pointer-events-none"
            initial={{ y: 0, opacity: 1, scale: 0.5 }}
            animate={{ y: -60, opacity: 0, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-2xl font-black text-red-500 drop-shadow-lg">
              -{value}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Taunt Speech Bubble */}
      <AnimatePresence>
        {taunt && (
          <motion.div
            className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-background border-2 border-primary rounded-lg px-3 py-2 shadow-lg max-w-[200px]"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
          >
            <p className="text-xs font-medium text-foreground text-center">
              {taunt}
            </p>
            {/* Speech bubble tail */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-primary" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
