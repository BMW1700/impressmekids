import { motion, AnimatePresence } from "framer-motion";
import { Skull, AlertTriangle, Sparkles, Crosshair, Target } from "lucide-react";
import { RPGEnemy } from "@/lib/rpgBattleData";
import { useEffect, useState } from "react";
import { GameTheme } from "@/lib/gameTheme";

interface RPGEnemyTransitionProps {
  isActive: boolean;
  defeatedEnemy: RPGEnemy | null;
  nextEnemy: RPGEnemy | null;
  onTransitionComplete: () => void;
  theme?: GameTheme;
}

export const RPGEnemyTransition = ({
  isActive,
  defeatedEnemy,
  nextEnemy,
  onTransitionComplete,
  theme = 'classic',
}: RPGEnemyTransitionProps) => {
  const [showNext, setShowNext] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const isAgent = theme === 'agent';

  useEffect(() => {
    if (isActive) {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 200);
      setTimeout(() => setShowNext(true), 1500);
      setTimeout(onTransitionComplete, 4000);
    } else {
      setShowNext(false);
    }
  }, [isActive, onTransitionComplete]);

  if (!isActive) return null;

  const isBossType = nextEnemy?.type === 'dragon' || nextEnemy?.type === 'boss' || nextEnemy?.type === 'final_boss';

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Screen flash */}
          {showFlash && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-white z-50"
            />
          )}

          {/* Dark overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/95"
          />

          {/* Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={`spark-${i}`}
                className="absolute"
                style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, 180] }}
                transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 3 }}
              >
                {isAgent ? (
                  <Crosshair className="h-4 w-4 text-cyan-400" />
                ) : (
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 text-center space-y-8">
            {/* Defeated enemy */}
            {defeatedEnemy && !showNext && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.5, 0] }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="relative"
                >
                  <motion.div
                    animate={{ rotate: [0, -20, 20, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    {isAgent ? (
                      <Target className="h-24 w-24 text-cyan-500 mx-auto" />
                    ) : (
                      <Skull className="h-24 w-24 text-red-500 mx-auto" />
                    )}
                    <motion.div
                      initial={{ scale: 0.5, opacity: 1 }}
                      animate={{ scale: 3, opacity: 0 }}
                      transition={{ duration: 1 }}
                      className={`absolute inset-0 border-4 ${isAgent ? 'border-cyan-500' : 'border-red-500'} rounded-full`}
                    />
                  </motion.div>
                </motion.div>

                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`text-4xl font-black uppercase tracking-wider ${isAgent ? 'text-cyan-400' : 'text-red-400'}`}
                >
                  {defeatedEnemy.name}
                </motion.h2>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500"
                >
                  {isAgent ? 'TARGET NEUTRALIZED!' : 'DEFEATED!'}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex justify-center gap-2"
                >
                  {[...Array(5)].map((_, i) => (
                    <motion.span
                      key={i}
                      animate={{ y: [0, -10, 0], rotate: [0, 360] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                      className="text-2xl"
                    >
                      {isAgent ? '🎯' : '⭐'}
                    </motion.span>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* Next enemy warning */}
            {nextEnemy && showNext && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="space-y-6"
              >
                {/* Warning banner */}
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    boxShadow: isAgent
                      ? ["0 0 20px rgba(6,182,212,0.3)", "0 0 40px rgba(6,182,212,0.6)", "0 0 20px rgba(6,182,212,0.3)"]
                      : ["0 0 20px rgba(234,179,8,0.3)", "0 0 40px rgba(234,179,8,0.6)", "0 0 20px rgba(234,179,8,0.3)"],
                  }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className={`flex items-center justify-center gap-4 px-6 py-3 rounded-lg border-2 ${
                    isAgent
                      ? 'bg-cyan-900/50 border-cyan-500'
                      : 'bg-yellow-900/50 border-yellow-500'
                  }`}
                >
                  {isAgent ? (
                    <Crosshair className="h-8 w-8 text-cyan-400" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-yellow-400" />
                  )}
                  <span className={`text-2xl font-black uppercase tracking-wider ${
                    isAgent ? 'text-cyan-400' : 'text-yellow-400'
                  }`}>
                    {isAgent
                      ? (isBossType ? '⚠️ HIGH-VALUE TARGET!' : 'PRIORITY TARGET DETECTED!')
                      : (isBossType ? 'BOSS BATTLE!' : 'Next Enemy Approaches!')}
                  </span>
                  {isAgent ? (
                    <Crosshair className="h-8 w-8 text-cyan-400" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-yellow-400" />
                  )}
                </motion.div>

                {/* Boss entrance (dragon for classic, agent boss for agent) */}
                {isBossType && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: "spring", bounce: 0.4 }}
                    className="space-y-4"
                  >
                    <motion.div
                      animate={{
                        y: [0, -20, 0],
                        filter: isAgent
                          ? ["drop-shadow(0 0 20px rgba(6,182,212,0.5))", "drop-shadow(0 0 40px rgba(6,182,212,0.8))", "drop-shadow(0 0 20px rgba(6,182,212,0.5))"]
                          : ["drop-shadow(0 0 20px rgba(255,100,0,0.5))", "drop-shadow(0 0 40px rgba(255,100,0,0.8))", "drop-shadow(0 0 20px rgba(255,100,0,0.5))"],
                      }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="text-9xl"
                    >
                      {isAgent ? '🎯' : '🐉'}
                    </motion.div>
                    <motion.h1
                      initial={{ letterSpacing: "0.5em", opacity: 0 }}
                      animate={{ letterSpacing: "0.1em", opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      className={`text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r ${nextEnemy.color}`}
                    >
                      {nextEnemy.name}
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className={`text-xl italic max-w-md mx-auto ${isAgent ? 'text-cyan-300' : 'text-orange-300'}`}
                    >
                      "{nextEnemy.dialogueIntro[0]}"
                    </motion.p>
                  </motion.div>
                )}

                {/* Generic entrance for non-boss */}
                {!isBossType && (
                  <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4"
                  >
                    <motion.h1
                      className={`text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r ${nextEnemy.color}`}
                    >
                      {nextEnemy.name}
                    </motion.h1>
                    <p className={`text-lg italic ${isAgent ? 'text-slate-400' : 'text-slate-300'}`}>
                      "{nextEnemy.dialogueIntro[0]}"
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Fire/energy effects for boss */}
            {isBossType && showNext && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(40)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      bottom: -20,
                      width: 8 + Math.random() * 16,
                      height: 8 + Math.random() * 16,
                      background: isAgent
                        ? `linear-gradient(to top, hsl(${180 + Math.random() * 20}, 100%, 50%), hsl(${190 + Math.random() * 20}, 100%, 60%))`
                        : `linear-gradient(to top, hsl(${20 + Math.random() * 30}, 100%, 50%), hsl(${40 + Math.random() * 20}, 100%, 60%))`,
                    }}
                    initial={{ y: 0, opacity: 0 }}
                    animate={{ y: [-100, -400, -700], opacity: [0, 1, 0], scale: [0.5, 1.2, 0.3], x: [0, (Math.random() - 0.5) * 100] }}
                    transition={{ duration: 2 + Math.random(), repeat: Infinity, delay: Math.random() * 2, ease: "easeOut" }}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
