import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface RPGEnemyAbilityEffectProps {
  abilityType: 'poison' | 'debuff' | 'silence' | 'word_barrage' | null;
  isActive: boolean;
  onComplete?: () => void;
}

interface PoisonBubble {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

export const RPGEnemyAbilityEffect = ({ 
  abilityType, 
  isActive, 
  onComplete 
}: RPGEnemyAbilityEffectProps) => {
  const [bubbles, setBubbles] = useState<PoisonBubble[]>([]);

  useEffect(() => {
    if (isActive && abilityType) {
      // Generate effect particles
      const newBubbles = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: 60 + Math.random() * 35,
        y: 30 + Math.random() * 40,
        size: 10 + Math.random() * 20,
        delay: Math.random() * 0.5,
      }));
      setBubbles(newBubbles);

      const timer = setTimeout(() => {
        onComplete?.();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isActive, abilityType, onComplete]);

  if (!isActive || !abilityType) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-45">
        {/* POISON Effect */}
        {abilityType === 'poison' && (
          <>
            {/* Green screen overlay */}
            <motion.div
              className="absolute inset-0 bg-green-900/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.4, 0.3, 0.4, 0] }}
              transition={{ duration: 1.5 }}
            />

            {/* Poison cloud over heroes */}
            <motion.div
              className="absolute right-[10%] top-1/3 w-[35%] h-[40%]"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.5 }}
            >
              {/* Main cloud */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-radial from-green-500/60 via-green-600/40 to-transparent blur-xl"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ repeat: 3, duration: 0.5 }}
              />

              {/* Poison bubbles */}
              {bubbles.map((bubble) => (
                <motion.div
                  key={bubble.id}
                  className="absolute rounded-full bg-gradient-radial from-green-400 to-green-600 border border-green-300/50"
                  style={{
                    width: bubble.size,
                    height: bubble.size,
                    left: `${bubble.x - 60}%`,
                    top: `${bubble.y - 30}%`,
                  }}
                  initial={{ y: 0, opacity: 0, scale: 0 }}
                  animate={{ 
                    y: [0, -50, -100],
                    opacity: [0, 0.8, 0],
                    scale: [0, 1, 0.5],
                  }}
                  transition={{ 
                    duration: 1.2,
                    delay: bubble.delay,
                  }}
                />
              ))}

              {/* Skull emoji */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl"
                initial={{ opacity: 0, scale: 0, rotate: -20 }}
                animate={{ 
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.2, 1, 0.8],
                  rotate: [-20, 0, 0, 20],
                }}
                transition={{ duration: 1.2 }}
              >
                ☠️
              </motion.div>
            </motion.div>

            {/* Dripping effect */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 rounded-full bg-gradient-to-b from-green-500 to-green-700"
                style={{
                  right: `${15 + i * 6}%`,
                  top: '35%',
                  height: '0px',
                }}
                animate={{
                  height: ['0px', '30px', '0px'],
                  top: ['35%', '45%', '55%'],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 0.8,
                  delay: 0.3 + i * 0.15,
                }}
              />
            ))}
          </>
        )}

        {/* DEBUFF Effect */}
        {abilityType === 'debuff' && (
          <>
            {/* Purple screen overlay */}
            <motion.div
              className="absolute inset-0 bg-purple-900/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.4, 0.2] }}
              transition={{ duration: 1 }}
            />

            {/* Spiral effect over heroes */}
            <motion.div
              className="absolute right-[15%] top-[35%]"
              initial={{ opacity: 0, rotate: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0.8, 0],
                rotate: [0, 360, 720],
                scale: [0, 1.5, 2, 0],
              }}
              transition={{ duration: 1.5 }}
            >
              <div 
                className="w-40 h-40 rounded-full border-4 border-dashed border-purple-500"
                style={{
                  boxShadow: '0 0 30px rgba(168, 85, 247, 0.6), inset 0 0 30px rgba(168, 85, 247, 0.3)',
                }}
              />
            </motion.div>

            {/* Down arrows indicating weakness */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-4xl text-red-500"
                style={{
                  right: `${18 + i * 8}%`,
                  top: '30%',
                }}
                initial={{ y: -20, opacity: 0 }}
                animate={{ 
                  y: [0, 50, 100],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.2,
                }}
              >
                ⬇️
              </motion.div>
            ))}

            {/* Weakness text */}
            <motion.div
              className="absolute right-[20%] top-[55%] text-xl font-bold text-purple-400"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 1] }}
              transition={{ duration: 1.2, delay: 0.3 }}
              style={{ textShadow: '0 0 20px rgba(168, 85, 247, 0.8)' }}
            >
              WEAKENED!
            </motion.div>
          </>
        )}

        {/* SILENCE Effect */}
        {abilityType === 'silence' && (
          <>
            {/* Dark overlay */}
            <motion.div
              className="absolute inset-0 bg-slate-900/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0.3] }}
              transition={{ duration: 0.8 }}
            />

            {/* Silence symbol over wizard */}
            <motion.div
              className="absolute right-[25%] top-[40%]"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                scale: [0, 1.5, 1.3, 0],
              }}
              transition={{ duration: 1.2 }}
            >
              <div className="text-7xl">🔇</div>
            </motion.div>

            {/* Sound wave cancellation */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute right-[28%] top-[45%] rounded-full border-2 border-red-500/60"
                style={{
                  width: `${60 + i * 40}px`,
                  height: `${60 + i * 40}px`,
                  marginLeft: `-${30 + i * 20}px`,
                  marginTop: `-${30 + i * 20}px`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 0.8, 0],
                  scale: [0.5, 1, 1.5],
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.15,
                }}
              />
            ))}

            {/* X marks */}
            <motion.div
              className="absolute right-[26%] top-[42%] text-6xl text-red-600 font-black"
              initial={{ opacity: 0, rotate: -45, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0.8],
                rotate: [0, 0, 0],
                scale: [0, 1.3, 1],
              }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              ✕
            </motion.div>
          </>
        )}

        {/* WORD BARRAGE announcement */}
        {abilityType === 'word_barrage' && (
          <>
            {/* Storm overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-purple-900/60 via-transparent to-red-900/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.7, 0.5] }}
              transition={{ duration: 0.5 }}
            />

            {/* Warning text */}
            <motion.div
              className="absolute top-1/3 left-1/2 -translate-x-1/2"
              initial={{ opacity: 0, scale: 0, y: 50 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1.5, 1.3, 0.8],
                y: [50, 0, 0, -50],
              }}
              transition={{ duration: 1.2 }}
            >
              <div 
                className="text-5xl font-black text-transparent bg-clip-text 
                  bg-gradient-to-r from-red-500 via-purple-500 to-red-500"
                style={{
                  textShadow: '0 0 40px rgba(239, 68, 68, 0.8)',
                }}
              >
                WORD STORM!
              </div>
            </motion.div>

            {/* Swirling words preview */}
            {['READ', 'SPEAK', 'SAY', 'NOW'].map((word, i) => (
              <motion.div
                key={word}
                className="absolute text-2xl font-bold text-white/60"
                style={{
                  left: `${20 + i * 20}%`,
                  top: `${40 + (i % 2) * 15}%`,
                }}
                initial={{ opacity: 0, rotate: -30 + i * 20 }}
                animate={{ 
                  opacity: [0, 0.6, 0],
                  rotate: [-30 + i * 20, 30 - i * 10],
                  scale: [0.5, 1.2, 0.8],
                }}
                transition={{
                  duration: 1,
                  delay: 0.2 + i * 0.1,
                }}
              >
                {word}
              </motion.div>
            ))}
          </>
        )}
      </div>
    </AnimatePresence>
  );
};
