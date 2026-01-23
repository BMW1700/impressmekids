import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Coins, Star, Gift, Flame, X, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DAILY_REWARDS, getRewardForDay, getNextMilestone, formatStreakMessage } from "@/lib/dailyRewardsData";
import { useDailyRewards } from "@/hooks/useDailyRewards";

interface DailyRewardCalendarProps {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DailyRewardCalendar = ({ studentId, isOpen, onClose }: DailyRewardCalendarProps) => {
  const {
    streakInfo,
    hasClaimedToday,
    currentStreak,
    longestStreak,
    claimDailyReward,
    isClaimingReward,
    loginHistory,
  } = useDailyRewards(studentId);

  const nextMilestone = getNextMilestone(currentStreak);
  const todayReward = getRewardForDay(currentStreak + 1);

  // Get claimed days for the current week
  const getClaimedDays = () => {
    const today = new Date();
    return loginHistory
      .filter(l => {
        const loginDate = new Date(l.login_date);
        const diffDays = Math.floor((today.getTime() - loginDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays < 7;
      })
      .map(l => new Date(l.login_date).toDateString());
  };

  const claimedDays = getClaimedDays();

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 rounded-2xl p-6 max-w-md w-full border border-purple-500/30 shadow-[0_0_50px_rgba(139,92,246,0.3)]"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <Flame className="w-7 h-7 text-orange-500" />
                  Daily Rewards
                </h2>
                <p className="text-sm text-purple-300">{formatStreakMessage(currentStreak)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Streak Display */}
            <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-xl p-4 mb-6 border border-orange-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Flame className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-white">{currentStreak}</div>
                    <div className="text-sm text-orange-300">Day Streak</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-amber-300">Best: {longestStreak} days</div>
                  {nextMilestone && (
                    <div className="text-xs text-purple-300 mt-1">
                      Next milestone: Day {nextMilestone}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Weekly Calendar */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {DAILY_REWARDS.map((reward, index) => {
                const dayNum = index + 1;
                const isClaimed = index < currentStreak % 7 || (hasClaimedToday && index === currentStreak % 7);
                const isToday = !hasClaimedToday && index === currentStreak % 7;
                const isFuture = index > currentStreak % 7;

                return (
                  <motion.div
                    key={dayNum}
                    whileHover={isToday ? { scale: 1.05 } : {}}
                    className={`relative rounded-xl p-2 text-center transition-all ${
                      isClaimed
                        ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-2 border-green-500/50'
                        : isToday
                        ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30 border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="text-xs text-white/60 mb-1">Day {dayNum}</div>
                    
                    {reward.isSpecial ? (
                      <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-1">
                        <Gift className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center mb-1">
                        <Coins className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <div className="text-xs font-bold text-yellow-400">+{reward.gold}</div>
                    
                    {isClaimed && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
                      >
                        <span className="text-xs">✓</span>
                      </motion.div>
                    )}
                    
                    {isToday && !hasClaimedToday && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"
                      >
                        <Sparkles className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Today's Reward */}
            {!hasClaimedToday && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-xl p-4 mb-4 border border-amber-400/30"
              >
                <div className="text-center mb-3">
                  <div className="text-sm text-amber-300 mb-1">Today's Reward</div>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1">
                      <Coins className="w-5 h-5 text-yellow-400" />
                      <span className="text-xl font-bold text-yellow-400">+{todayReward.gold}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-purple-400" />
                      <span className="text-xl font-bold text-purple-400">+{todayReward.xp} XP</span>
                    </div>
                  </div>
                  {todayReward.bonus && (
                    <div className="mt-2 text-sm text-pink-400 flex items-center justify-center gap-1">
                      <Gift className="w-4 h-4" />
                      <span>+ {todayReward.bonus.label}!</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Claim Button */}
            <Button
              onClick={() => claimDailyReward()}
              disabled={hasClaimedToday || isClaimingReward}
              className={`w-full h-14 text-lg font-bold ${
                hasClaimedToday
                  ? 'bg-green-600/50 text-green-200'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/30'
              }`}
            >
              {isClaimingReward ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Sparkles className="w-6 h-6" />
                </motion.div>
              ) : hasClaimedToday ? (
                <>✓ Claimed! Come back tomorrow!</>
              ) : (
                <>
                  <Gift className="w-6 h-6 mr-2" />
                  Claim Daily Reward!
                </>
              )}
            </Button>

            {/* Milestone Preview */}
            {nextMilestone && (
              <div className="mt-4 text-center">
                <div className="text-xs text-purple-300">
                  {nextMilestone - currentStreak} more days until Day {nextMilestone} milestone!
                </div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-yellow-400 font-bold">
                    Bonus rewards await!
                  </span>
                </div>
              </div>
            )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
