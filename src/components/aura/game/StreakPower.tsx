import { motion, AnimatePresence } from "framer-motion";
import { Zap, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StreakPowerProps {
  currentStreak: number;
  onActivate: () => void;
  isAvailable: boolean;
  cooldownActive: boolean;
}

export const StreakPower = ({
  currentStreak,
  onActivate,
  isAvailable,
  cooldownActive,
}: StreakPowerProps) => {
  const isMegaPower = currentStreak >= 10;
  const isPowerReady = currentStreak >= 5;

  if (!isPowerReady || !isAvailable || cooldownActive) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="relative"
      >
        <motion.div
          className="absolute inset-0 rounded-xl blur-xl"
          style={{
            background: isMegaPower 
              ? 'radial-gradient(circle, rgba(168,85,247,0.6) 0%, rgba(139,92,246,0.3) 50%, transparent 70%)'
              : 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, rgba(168,85,247,0.2) 50%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            repeat: Infinity,
            duration: 1,
          }}
        />
        
        <Button
          onClick={onActivate}
          className={`
            relative z-10 px-6 py-3 font-black text-lg
            ${isMegaPower 
              ? 'bg-gradient-to-r from-purple-600 via-violet-500 to-fuchsia-500 hover:from-purple-500 hover:via-violet-400 hover:to-fuchsia-400' 
              : 'bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-400 hover:to-violet-400'
            }
            text-white shadow-lg shadow-purple-500/50
            border-2 border-purple-300/50
            transition-all duration-200
          `}
        >
          <motion.div
            className="flex items-center gap-2"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 0.5,
            }}
          >
            {isMegaPower ? (
              <>
                <Flame className="w-5 h-5 text-yellow-300" />
                <span>🔥 MEGA POWER! 🔥</span>
                <Flame className="w-5 h-5 text-yellow-300" />
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 text-yellow-300" />
                <span>⚡ POWER READY!</span>
                <Zap className="w-5 h-5 text-yellow-300" />
              </>
            )}
          </motion.div>
        </Button>

        {/* Power damage preview */}
        <motion.div
          className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-purple-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          +{isMegaPower ? 100 : 50} Damage!
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
