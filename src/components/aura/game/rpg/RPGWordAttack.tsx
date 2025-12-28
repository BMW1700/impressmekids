import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Zap, Snowflake, Sword } from "lucide-react";

interface RPGWordAttackProps {
  word: string;
  isCorrect: boolean | null;
  streak: number;
  damage: number;
  attackType?: 'fire' | 'ice' | 'lightning' | 'slash';
  onAnimationComplete?: () => void;
}

export const RPGWordAttack = ({
  word,
  isCorrect,
  streak,
  damage,
  attackType = 'fire',
  onAnimationComplete,
}: RPGWordAttackProps) => {
  const [showAttack, setShowAttack] = useState(false);

  useEffect(() => {
    if (isCorrect === true) {
      setShowAttack(true);
      const timer = setTimeout(() => {
        setShowAttack(false);
        onAnimationComplete?.();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isCorrect, onAnimationComplete]);

  const getAttackIcon = () => {
    switch (attackType) {
      case 'fire':
        return <Flame className="h-8 w-8 text-orange-500" />;
      case 'ice':
        return <Snowflake className="h-8 w-8 text-cyan-400" />;
      case 'lightning':
        return <Zap className="h-8 w-8 text-yellow-400" />;
      case 'slash':
        return <Sword className="h-8 w-8 text-gray-300" />;
      default:
        return <Flame className="h-8 w-8 text-orange-500" />;
    }
  };

  const getAttackColor = () => {
    switch (attackType) {
      case 'fire':
        return 'from-orange-500 to-red-600';
      case 'ice':
        return 'from-cyan-400 to-blue-600';
      case 'lightning':
        return 'from-yellow-400 to-amber-600';
      case 'slash':
        return 'from-gray-300 to-gray-500';
      default:
        return 'from-orange-500 to-red-600';
    }
  };

  return (
    <div className="relative">
      {/* Word Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          color: isCorrect === true ? '#22c55e' : isCorrect === false ? '#ef4444' : undefined,
        }}
        className="text-2xl md:text-3xl font-bold text-center py-4"
      >
        {word}
      </motion.div>

      {/* Streak Indicator */}
      {streak > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white 
            px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"
        >
          <Flame className="h-3 w-3" />
          x{streak}
        </motion.div>
      )}

      {/* Attack Animation */}
      <AnimatePresence>
        {showAttack && isCorrect && (
          <motion.div
            initial={{ opacity: 0, x: -100, scale: 0.5 }}
            animate={{ opacity: 1, x: 100, scale: 1.2 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            {/* Projectile */}
            <motion.div
              className={`w-16 h-16 rounded-full bg-gradient-to-r ${getAttackColor()} 
                flex items-center justify-center shadow-lg`}
              animate={{ 
                rotate: attackType === 'fire' ? [0, 360] : 0,
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 0.3, repeat: 1 }}
            >
              {getAttackIcon()}
            </motion.div>

            {/* Damage Number */}
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="absolute text-2xl font-black text-red-500 drop-shadow-lg"
              style={{ textShadow: '2px 2px 0px black' }}
            >
              -{damage}
            </motion.div>

            {/* Trail Effect */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.8, x: -100 - i * 20, scale: 1 - i * 0.15 }}
                animate={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={`absolute w-8 h-8 rounded-full bg-gradient-to-r ${getAttackColor()} blur-sm`}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Miss Effect */}
      <AnimatePresence>
        {isCorrect === false && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.3 }}
              className="text-4xl"
            >
              ❌
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
