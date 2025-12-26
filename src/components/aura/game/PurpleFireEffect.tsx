import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface PurpleFireEffectProps {
  trigger: number; // Changed to trigger re-render
  damage: number;
  isMega: boolean;
  onComplete?: () => void;
}

export const PurpleFireEffect = ({
  trigger,
  damage,
  isMega,
  onComplete,
}: PurpleFireEffectProps) => {
  const [isActive, setIsActive] = useState(false);
  const [showDamage, setShowDamage] = useState(false);

  useEffect(() => {
    if (trigger > 0) {
      setIsActive(true);
      
      // Show damage number after blast reaches enemy
      const damageTimer = setTimeout(() => {
        setShowDamage(true);
      }, 400);

      // Complete animation
      const completeTimer = setTimeout(() => {
        setIsActive(false);
        setShowDamage(false);
        onComplete?.();
      }, 1200);

      return () => {
        clearTimeout(damageTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [trigger, onComplete]);

  if (!isActive && !showDamage) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {/* Screen shake effect */}
      <motion.div
        className="absolute inset-0"
        animate={isActive ? {
          x: [0, -5, 5, -5, 5, 0],
          y: [0, 3, -3, 3, -3, 0],
        } : {}}
        transition={{ duration: 0.4 }}
      />

      {/* Purple fire blast beam */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute left-1/4 top-1/2 -translate-y-1/2"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ transformOrigin: "left center" }}
          >
            {/* Main beam */}
            <motion.div
              className={`h-16 ${isMega ? 'w-[60vw]' : 'w-[50vw]'} rounded-full`}
              style={{
                background: isMega
                  ? 'linear-gradient(90deg, rgba(168,85,247,1) 0%, rgba(217,70,239,1) 30%, rgba(236,72,153,1) 60%, rgba(251,146,60,0.8) 100%)'
                  : 'linear-gradient(90deg, rgba(139,92,246,1) 0%, rgba(168,85,247,1) 50%, rgba(192,132,252,0.6) 100%)',
                boxShadow: isMega
                  ? '0 0 60px rgba(168,85,247,0.8), 0 0 120px rgba(217,70,239,0.6), 0 0 180px rgba(236,72,153,0.4)'
                  : '0 0 40px rgba(139,92,246,0.7), 0 0 80px rgba(168,85,247,0.5)',
              }}
              animate={{
                scaleY: [1, 1.3, 0.8, 1.2, 1],
              }}
              transition={{
                duration: 0.3,
                repeat: 2,
              }}
            />

            {/* Fire particles */}
            {Array.from({ length: isMega ? 20 : 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: Math.random() * 20 + 10,
                  height: Math.random() * 20 + 10,
                  background: isMega
                    ? `radial-gradient(circle, rgba(251,146,60,1) 0%, rgba(236,72,153,0.8) 50%, rgba(168,85,247,0) 100%)`
                    : `radial-gradient(circle, rgba(192,132,252,1) 0%, rgba(139,92,246,0.8) 50%, rgba(139,92,246,0) 100%)`,
                  left: `${Math.random() * 100}%`,
                  top: `${(Math.random() - 0.5) * 100}px`,
                }}
                initial={{ scale: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [1, 0.8, 0],
                  x: [0, Math.random() * 100 - 50],
                  y: [0, Math.random() * 60 - 30],
                }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.03,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Impact flash on enemy */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute right-1/4 top-1/3 w-32 h-32 -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 3, 2], opacity: [0, 1, 0] }}
            transition={{ duration: 0.5, delay: 0.25 }}
            style={{
              background: isMega
                ? 'radial-gradient(circle, rgba(251,146,60,1) 0%, rgba(236,72,153,0.6) 40%, rgba(168,85,247,0) 70%)'
                : 'radial-gradient(circle, rgba(192,132,252,1) 0%, rgba(139,92,246,0.6) 40%, transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Damage number popup */}
      <AnimatePresence>
        {showDamage && (
          <motion.div
            className="absolute right-1/4 top-1/4"
            initial={{ scale: 0, y: 0, opacity: 0 }}
            animate={{ scale: 1.5, y: -50, opacity: 1 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.4 }}
          >
            <div 
              className={`
                text-4xl font-black drop-shadow-lg
                ${isMega 
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500' 
                  : 'text-purple-300'
                }
              `}
              style={{
                textShadow: isMega
                  ? '0 0 20px rgba(251,146,60,0.8), 0 0 40px rgba(236,72,153,0.6)'
                  : '0 0 15px rgba(139,92,246,0.8)',
              }}
            >
              {isMega ? '🔥' : '⚡'} +{damage}!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full screen purple flash */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.4 }}
            style={{
              background: isMega
                ? 'radial-gradient(circle at 30% 50%, rgba(168,85,247,0.4) 0%, transparent 60%)'
                : 'radial-gradient(circle at 30% 50%, rgba(139,92,246,0.3) 0%, transparent 50%)',
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
