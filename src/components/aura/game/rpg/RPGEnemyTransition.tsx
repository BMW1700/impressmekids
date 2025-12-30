import { motion, AnimatePresence } from "framer-motion";
import { Skull, AlertTriangle } from "lucide-react";
import { RPGEnemy } from "@/lib/rpgBattleData";

interface RPGEnemyTransitionProps {
  isActive: boolean;
  defeatedEnemy: RPGEnemy | null;
  nextEnemy: RPGEnemy | null;
  onTransitionComplete: () => void;
}

export const RPGEnemyTransition = ({
  isActive,
  defeatedEnemy,
  nextEnemy,
  onTransitionComplete,
}: RPGEnemyTransitionProps) => {
  if (!isActive) return null;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onAnimationComplete={() => {
            setTimeout(onTransitionComplete, 3000);
          }}
        >
          {/* Dark overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/90"
          />

          {/* Content */}
          <div className="relative z-10 text-center space-y-8">
            {/* Defeated enemy message */}
            {defeatedEnemy && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ repeat: 2, duration: 0.3 }}
                >
                  <Skull className="h-20 w-20 text-red-500 mx-auto" />
                </motion.div>
                <h2 className="text-3xl font-bold text-red-400">
                  {defeatedEnemy.name} DEFEATED!
                </h2>
              </motion.div>
            )}

            {/* Next enemy warning */}
            {nextEnemy && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="space-y-6"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="flex items-center justify-center gap-4"
                >
                  <AlertTriangle className="h-8 w-8 text-yellow-400" />
                  <span className="text-yellow-400 text-2xl font-bold uppercase tracking-wider">
                    Next Enemy Approaches!
                  </span>
                  <AlertTriangle className="h-8 w-8 text-yellow-400" />
                </motion.div>

                {/* Dragon specific entrance */}
                {nextEnemy.type === 'dragon' && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 2, type: "spring", bounce: 0.4 }}
                    className="space-y-4"
                  >
                    <motion.span
                      animate={{ 
                        textShadow: [
                          "0 0 20px rgba(255,100,0,0.5)",
                          "0 0 40px rgba(255,100,0,0.8)",
                          "0 0 20px rgba(255,100,0,0.5)",
                        ]
                      }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="text-8xl block"
                    >
                      🐉
                    </motion.span>
                    <h1 className={`text-5xl font-black text-transparent bg-clip-text 
                      bg-gradient-to-r ${nextEnemy.color}`}>
                      {nextEnemy.name}
                    </h1>
                    <p className="text-orange-300 text-xl italic">
                      "{nextEnemy.dialogueIntro[0]}"
                    </p>
                  </motion.div>
                )}

                {/* Generic entrance for other enemies */}
                {nextEnemy.type !== 'dragon' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 2 }}
                    className="space-y-4"
                  >
                    <h1 className={`text-4xl font-black text-transparent bg-clip-text 
                      bg-gradient-to-r ${nextEnemy.color}`}>
                      {nextEnemy.name}
                    </h1>
                    <p className="text-slate-300 text-lg italic">
                      "{nextEnemy.dialogueIntro[0]}"
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Fire effects for dragon */}
            {nextEnemy?.type === 'dragon' && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-4 h-4 bg-gradient-to-t from-orange-500 to-yellow-400 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      bottom: 0,
                    }}
                    initial={{ y: 0, opacity: 0 }}
                    animate={{
                      y: [-100, -300, -500],
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                      ease: "easeOut",
                    }}
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