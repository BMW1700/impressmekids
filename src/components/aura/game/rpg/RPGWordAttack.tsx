import { useState, useEffect } from "react";
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
  const [showCritical, setShowCritical] = useState(false);

  useEffect(() => {
    if (isCorrect === true) {
      setShowAttack(true);
      setShowCritical(damage >= 20);
      const timer = setTimeout(() => {
        setShowAttack(false);
        setShowCritical(false);
        onAnimationComplete?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isCorrect, damage, onAnimationComplete]);

  const getAttackIcon = () => {
    const iconClass = "h-10 w-10 drop-shadow-lg";
    switch (attackType) {
      case 'fire':
        return <Flame className={`${iconClass} text-orange-400`} />;
      case 'ice':
        return <Snowflake className={`${iconClass} text-cyan-300`} />;
      case 'lightning':
        return <Zap className={`${iconClass} text-yellow-300`} />;
      case 'slash':
        return <Sword className={`${iconClass} text-slate-200`} />;
      default:
        return <Flame className={`${iconClass} text-orange-400`} />;
    }
  };

  const getAttackColor = () => {
    switch (attackType) {
      case 'fire': return 'from-orange-500 via-red-500 to-yellow-500';
      case 'ice': return 'from-cyan-400 via-blue-500 to-indigo-500';
      case 'lightning': return 'from-yellow-300 via-amber-400 to-orange-400';
      case 'slash': return 'from-slate-300 via-slate-400 to-slate-500';
      default: return 'from-orange-500 via-red-500 to-yellow-500';
    }
  };

  const getGlowColor = () => {
    switch (attackType) {
      case 'fire': return 'rgba(249, 115, 22, 0.6)';
      case 'ice': return 'rgba(34, 211, 238, 0.6)';
      case 'lightning': return 'rgba(250, 204, 21, 0.6)';
      case 'slash': return 'rgba(148, 163, 184, 0.6)';
      default: return 'rgba(249, 115, 22, 0.6)';
    }
  };

  return (
    <div className="relative h-20 flex items-center justify-center">
      {/* Success Attack Animation */}
      <AnimatePresence>
        {showAttack && isCorrect && (
          <>
            {/* Main projectile */}
            <motion.div
              initial={{ opacity: 0, x: 100, scale: 0.5 }}
              animate={{ opacity: 1, x: -100, scale: 1.2 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="absolute flex items-center justify-center"
            >
              <motion.div
                className={`w-20 h-20 rounded-full bg-gradient-to-r ${getAttackColor()} 
                  flex items-center justify-center`}
                style={{ boxShadow: `0 0 40px ${getGlowColor()}` }}
                animate={{ 
                  rotate: attackType === 'fire' ? [0, 360] : 0,
                  scale: [1, 1.3, 1],
                }}
                transition={{ duration: 0.3, repeat: 1 }}
              >
                {getAttackIcon()}
              </motion.div>
            </motion.div>

            {/* Trailing particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.9, x: 100 - i * 15, scale: 1 - i * 0.1 }}
                animate={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.4, delay: i * 0.03 }}
                className={`absolute w-6 h-6 rounded-full bg-gradient-to-r ${getAttackColor()} blur-sm`}
              />
            ))}

            {/* Impact burst */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 2, 3] }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="absolute -left-20"
            >
              <div 
                className={`w-24 h-24 rounded-full bg-gradient-to-r ${getAttackColor()} blur-xl`}
                style={{ boxShadow: `0 0 60px ${getGlowColor()}` }}
              />
            </motion.div>

            {/* Floating damage number */}
            <motion.div
              initial={{ opacity: 1, y: 0, x: -50, scale: 1 }}
              animate={{ opacity: 0, y: -60, scale: 1.5 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute pointer-events-none"
            >
              <span 
                className="text-4xl font-black text-red-400"
                style={{ 
                  textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                }}
              >
                -{damage}
              </span>
            </motion.div>

            {/* Critical hit text */}
            {showCritical && (
              <motion.div
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: -40 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="absolute -top-4 left-0 right-0 flex justify-center pointer-events-none"
              >
                <span 
                  className="text-lg font-black text-yellow-300 tracking-wider"
                  style={{ textShadow: '2px 2px 0 #000' }}
                >
                  ⚡ CRITICAL! ⚡
                </span>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Miss Effect */}
      <AnimatePresence>
        {isCorrect === false && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3 }}
            className="absolute flex flex-col items-center gap-2"
          >
            <motion.div
              animate={{ rotate: [0, -15, 15, -15, 0] }}
              transition={{ duration: 0.4 }}
              className="text-5xl"
            >
              ❌
            </motion.div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 font-bold text-sm"
            >
              MISS!
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak combo indicator */}
      {streak >= 3 && isCorrect === true && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute -bottom-2 right-0"
        >
          <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 
            px-3 py-1 rounded-full text-white text-xs font-bold shadow-lg">
            <Flame className="h-3 w-3" />
            <span>x{streak} COMBO!</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
