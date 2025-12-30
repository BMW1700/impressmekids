import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Skull, Crown, Shield, Sword } from "lucide-react";

export type GrogState = 'idle' | 'hit' | 'attacking' | 'defeated' | 'taunting';
export type EnemyType = 'minion' | 'guard' | 'elite' | 'boss' | 'final_boss' | 'dragon';

interface GrogCharacterProps {
  state: GrogState;
  enemyType: EnemyType;
  healthPercent: number;
  worldNumber?: number;
  showDamage?: number;
  taunt?: string;
  avatarUrl?: string;
}

const enemyConfigs: Record<EnemyType, { 
  icon: React.ElementType; 
  gradient: string; 
  size: string;
  name: string;
}> = {
  minion: {
    icon: Skull,
    gradient: 'from-green-500 to-emerald-600',
    size: 'w-16 h-16',
    name: 'Goblin Minion',
  },
  guard: {
    icon: Shield,
    gradient: 'from-purple-500 to-indigo-600',
    size: 'w-20 h-20',
    name: 'Goblin Guard',
  },
  elite: {
    icon: Sword,
    gradient: 'from-red-500 to-rose-600',
    size: 'w-24 h-24',
    name: 'Elite Warrior',
  },
  boss: {
    icon: Crown,
    gradient: 'from-yellow-400 via-amber-500 to-orange-600',
    size: 'w-28 h-28',
    name: 'Grog the Goblin King',
  },
  final_boss: {
    icon: Crown,
    gradient: 'from-purple-600 via-violet-500 to-fuchsia-600',
    size: 'w-32 h-32',
    name: 'Galair the Wicked Sorcerer',
  },
  dragon: {
    icon: Skull,
    gradient: 'from-red-600 via-orange-500 to-yellow-500',
    size: 'w-36 h-36',
    name: 'Dalair the Destroyer',
  },
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
  const config = enemyConfigs[enemyType];
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
          className={`relative ${config.size} rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg border-4 border-background overflow-hidden`}
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
              <Icon className={`${enemyType === 'boss' ? 'w-14 h-14' : enemyType === 'elite' ? 'w-12 h-12' : enemyType === 'guard' ? 'w-10 h-10' : 'w-8 h-8'} text-white`} />
              
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
