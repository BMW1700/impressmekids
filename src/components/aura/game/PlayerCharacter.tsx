import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Shield, Sword } from "lucide-react";

export type PlayerState = 'idle' | 'attacking' | 'hit' | 'victory' | 'defeated';
export type PlayerGender = 'knight' | 'dame';

interface PlayerCharacterProps {
  state: PlayerState;
  healthPercent: number;
  gender?: PlayerGender;
  showDamage?: number;
  currentStreak?: number;
  avatarUrl?: string;
}

export const PlayerCharacter = ({
  state,
  healthPercent,
  gender = 'knight',
  showDamage,
  currentStreak = 0,
  avatarUrl,
}: PlayerCharacterProps) => {
  const [damageNumbers, setDamageNumbers] = useState<{ id: number; value: number }[]>([]);

  // Add damage number when showDamage changes
  useEffect(() => {
    if (showDamage && showDamage > 0) {
      const id = Date.now();
      setDamageNumbers(prev => [...prev, { id, value: showDamage }]);
      
      setTimeout(() => {
        setDamageNumbers(prev => prev.filter(d => d.id !== id));
      }, 1000);
    }
  }, [showDamage]);

  // Get animation based on state
  const getAnimation = () => {
    switch (state) {
      case 'hit':
        return { x: [10, -10, 10, -10, 0], scale: [1, 0.9, 1] };
      case 'attacking':
        return { x: [-20, 0], scale: [1.1, 1] };
      case 'victory':
        return { y: [0, -10, 0], scale: [1, 1.1, 1] };
      case 'defeated':
        return { rotate: -90, opacity: 0, y: 50 };
      default:
        return { y: [0, -3, 0] };
    }
  };

  // Get streak glow intensity
  const getStreakGlow = () => {
    if (currentStreak >= 10) return 'shadow-[0_0_30px_rgba(59,130,246,0.8)]';
    if (currentStreak >= 5) return 'shadow-[0_0_20px_rgba(59,130,246,0.5)]';
    if (currentStreak >= 3) return 'shadow-[0_0_10px_rgba(59,130,246,0.3)]';
    return '';
  };

  return (
    <div className="relative flex flex-col items-center gap-2">
      {/* Player Name */}
      <div className="text-sm font-bold text-foreground/80">
        {gender === 'knight' ? 'Brave Knight' : 'Brave Dame'}
      </div>

      {/* Main Character Container */}
      <motion.div
        className="relative"
        animate={getAnimation()}
        transition={{ duration: state === 'idle' ? 2 : 0.3, repeat: state === 'idle' ? Infinity : 0 }}
      >
        {/* Streak glow effect */}
        {currentStreak >= 3 && (
          <motion.div
            className="absolute inset-0 bg-blue-500 rounded-full blur-xl"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}

        {/* Character Circle */}
        <div
          className={`relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-4 border-background ${getStreakGlow()} overflow-hidden`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Player avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <>
              {/* Shield and Sword */}
              <div className="relative">
                <Shield className="w-8 h-8 text-white" />
                <Sword className="w-5 h-5 text-yellow-300 absolute -right-2 -top-1 rotate-45" />
              </div>
              
              {/* Knight Helmet Visor */}
              <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 flex gap-2">
                <motion.div
                  className="w-1.5 h-1.5 bg-cyan-300 rounded-full"
                  animate={{
                    opacity: state === 'attacking' ? [1, 0.5, 1] : 1,
                  }}
                  transition={{ duration: 0.2, repeat: state === 'attacking' ? 3 : 0 }}
                />
                <motion.div
                  className="w-1.5 h-1.5 bg-cyan-300 rounded-full"
                  animate={{
                    opacity: state === 'attacking' ? [1, 0.5, 1] : 1,
                  }}
                  transition={{ duration: 0.2, repeat: state === 'attacking' ? 3 : 0 }}
                />
              </div>
            </>
          )}
        </div>

        {/* Hit flash effect */}
        <AnimatePresence>
          {state === 'hit' && (
            <motion.div
              className="absolute inset-0 bg-red-500 rounded-full"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>

        {/* Attack flash effect */}
        <AnimatePresence>
          {state === 'attacking' && (
            <motion.div
              className="absolute inset-0 bg-blue-300 rounded-full"
              initial={{ opacity: 0.6 }}
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
            animate={{ y: -50, opacity: 0, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-xl font-black text-red-500 drop-shadow-lg">
              -{value}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Streak indicator */}
      {currentStreak >= 3 && (
        <motion.div
          className="absolute -bottom-6 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <span className="text-xs font-bold text-blue-400 whitespace-nowrap">
            {currentStreak >= 10 ? '🔥 SUPER!' : currentStreak >= 5 ? '⚡ Great!' : '✨ Nice!'}
          </span>
        </motion.div>
      )}
    </div>
  );
};
