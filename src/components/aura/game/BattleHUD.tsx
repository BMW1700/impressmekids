import { motion, AnimatePresence } from "framer-motion";
import { Flame, Zap, BookOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BattleHUDProps {
  enemyHp: number;
  enemyMaxHp: number;
  playerHp: number;
  playerMaxHp: number;
  currentStreak: number;
  wordsRead: number;
  correctWords: number;
  totalWords: number;
  worldNumber: number;
  enemyName: string;
  lastDamage?: number;
  lastMessage?: string;
}

export const BattleHUD = ({
  currentStreak,
  wordsRead,
  correctWords,
  totalWords,
  lastMessage,
}: BattleHUDProps) => {
  const readingProgress = totalWords > 0 ? (wordsRead / totalWords) * 100 : 0;
  const accuracy = wordsRead > 0 ? Math.round((correctWords / wordsRead) * 100) : 100;

  // Get streak tier for visual effects
  const getStreakTier = () => {
    if (currentStreak >= 10) return { tier: 'legendary', color: 'text-yellow-400', glow: 'shadow-yellow-400/50' };
    if (currentStreak >= 5) return { tier: 'epic', color: 'text-purple-400', glow: 'shadow-purple-400/50' };
    if (currentStreak >= 3) return { tier: 'rare', color: 'text-blue-400', glow: 'shadow-blue-400/50' };
    return { tier: 'normal', color: 'text-orange-400', glow: '' };
  };

  const streakInfo = getStreakTier();

  return (
    <div className="w-full space-y-2">
      {/* Compact Stats Row - Single Line */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {/* Streak Counter */}
        <motion.div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border ${
            currentStreak >= 3 ? 'shadow-lg ' + streakInfo.glow : ''
          }`}
          animate={currentStreak >= 3 ? { scale: [1, 1.02, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <Flame className={`w-4 h-4 ${streakInfo.color}`} />
          <span className={`font-bold text-sm ${streakInfo.color}`}>
            {currentStreak}
          </span>
          {currentStreak >= 5 && (
            <span className="text-xs">
              {currentStreak >= 10 ? '🔥' : '⚡'}
            </span>
          )}
        </motion.div>

        {/* Accuracy */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className="font-bold text-sm">{accuracy}%</span>
        </div>

        {/* Words Read */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
          <BookOpen className="w-4 h-4 text-blue-500" />
          <span className="font-bold text-sm">{wordsRead}/{totalWords}</span>
        </div>
      </div>

      {/* Compact Progress Bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Progress</span>
        <Progress value={readingProgress} className="h-1.5 flex-1" />
        <span className="text-xs font-medium">{Math.round(readingProgress)}%</span>
      </div>

      {/* Floating Message */}
      <AnimatePresence>
        {lastMessage && (
          <motion.div
            className="flex justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-primary px-4 py-2 rounded-lg shadow-lg">
              <span className="text-sm font-bold text-primary-foreground">
                {lastMessage}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
