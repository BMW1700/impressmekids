import { motion, AnimatePresence } from "framer-motion";
import { Heart, Flame, Zap, Swords, BookOpen } from "lucide-react";
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
  enemyHp,
  enemyMaxHp,
  playerHp,
  playerMaxHp,
  currentStreak,
  wordsRead,
  correctWords,
  totalWords,
  worldNumber,
  enemyName,
  lastDamage,
  lastMessage,
}: BattleHUDProps) => {
  const enemyHealthPercent = (enemyHp / enemyMaxHp) * 100;
  const playerHealthPercent = (playerHp / playerMaxHp) * 100;
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
    <div className="w-full space-y-4">
      {/* Top Section: Enemy vs Player */}
      <div className="flex items-start justify-between gap-4">
        {/* Enemy HP */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-foreground">{enemyName}</span>
          </div>
          <div className="relative">
            <div className="w-full h-4 bg-muted rounded-full overflow-hidden border border-border">
              <motion.div
                className={`h-full ${
                  enemyHealthPercent > 60 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                  enemyHealthPercent > 30 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
                  'bg-gradient-to-r from-red-500 to-rose-400'
                }`}
                animate={{ width: `${enemyHealthPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="absolute right-2 top-0 text-xs font-bold text-white drop-shadow-lg">
              {enemyHp}/{enemyMaxHp}
            </span>
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex items-center justify-center w-12 h-12">
          <motion.div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center font-black text-primary-foreground text-sm"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            VS
          </motion.div>
        </div>

        {/* Player HP */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 justify-end">
            <span className="text-sm font-bold text-foreground">Your Energy</span>
            <Heart className="w-4 h-4 text-pink-500" />
          </div>
          <div className="relative">
            <div className="w-full h-4 bg-muted rounded-full overflow-hidden border border-border">
              <motion.div
                className={`h-full ${
                  playerHealthPercent > 60 ? 'bg-gradient-to-r from-pink-500 to-rose-400' :
                  playerHealthPercent > 30 ? 'bg-gradient-to-r from-orange-500 to-amber-400' :
                  'bg-gradient-to-r from-red-600 to-red-400'
                }`}
                animate={{ width: `${playerHealthPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="absolute left-2 top-0 text-xs font-bold text-white drop-shadow-lg">
              {playerHp}/{playerMaxHp}
            </span>
          </div>
        </div>
      </div>

      {/* Middle Section: Streak & Stats */}
      <div className="flex items-center justify-center gap-6">
        {/* Streak Counter */}
        <motion.div
          className={`flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border ${
            currentStreak >= 3 ? 'shadow-lg ' + streakInfo.glow : ''
          }`}
          animate={currentStreak >= 3 ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <Flame className={`w-5 h-5 ${streakInfo.color}`} />
          <span className={`font-black text-lg ${streakInfo.color}`}>
            {currentStreak}
          </span>
          {currentStreak >= 5 && (
            <motion.span
              className="text-xs font-bold uppercase"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              {currentStreak >= 10 ? '🔥🔥🔥' : '⚡️'}
            </motion.span>
          )}
        </motion.div>

        {/* Accuracy */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border">
          <Zap className="w-5 h-5 text-yellow-500" />
          <span className="font-bold text-sm">{accuracy}%</span>
        </div>

        {/* Words Read */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border">
          <BookOpen className="w-5 h-5 text-blue-500" />
          <span className="font-bold text-sm">{wordsRead}/{totalWords}</span>
        </div>
      </div>

      {/* Bottom Section: Reading Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Story Progress</span>
          <span>{Math.round(readingProgress)}%</span>
        </div>
        <Progress value={readingProgress} className="h-2" />
      </div>

      {/* Floating Message */}
      <AnimatePresence>
        {lastMessage && (
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-primary px-6 py-3 rounded-xl shadow-2xl">
              <span className="text-xl font-black text-primary-foreground">
                {lastMessage}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
