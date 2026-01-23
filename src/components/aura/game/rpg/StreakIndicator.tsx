import { motion } from "framer-motion";
import { Flame, Gift } from "lucide-react";
import { useDailyRewards } from "@/hooks/useDailyRewards";

interface StreakIndicatorProps {
  studentId: string;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

export const StreakIndicator = ({ studentId, onClick, size = "md" }: StreakIndicatorProps) => {
  const { hasClaimedToday, currentStreak, isStreakActive } = useDailyRewards(studentId);

  const sizeClasses = {
    sm: { container: "px-2 py-1", icon: "w-3 h-3", text: "text-sm" },
    md: { container: "px-3 py-1.5", icon: "w-4 h-4", text: "text-base" },
    lg: { container: "px-4 py-2", icon: "w-5 h-5", text: "text-lg" },
  };

  const classes = sizeClasses[size];

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative flex items-center gap-1.5 rounded-full ${classes.container} ${
        !hasClaimedToday
          ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30'
          : 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30'
      }`}
    >
      <Flame className={`${classes.icon} ${!hasClaimedToday ? 'text-white' : 'text-orange-400'}`} />
      <span className={`font-black ${classes.text} ${!hasClaimedToday ? 'text-white' : 'text-orange-400'}`}>
        {currentStreak}
      </span>

      {/* Unclaimed reward indicator */}
      {!hasClaimedToday && (
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
        >
          <Gift className="w-3 h-3 text-white" />
        </motion.div>
      )}

      {/* Streak at risk indicator */}
      {!isStreakActive && currentStreak > 0 && (
        <motion.div
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"
        >
          <span className="text-xs text-white">!</span>
        </motion.div>
      )}
    </motion.button>
  );
};
