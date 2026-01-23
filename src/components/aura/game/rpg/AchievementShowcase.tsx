import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Trophy, X, Lock, Star, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlayerAchievements } from "@/hooks/usePlayerAchievements";
import { ACHIEVEMENT_CATEGORIES, AchievementCategory, getRarityColor, getRarityBorder } from "@/lib/achievementsData";

interface AchievementShowcaseProps {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AchievementShowcase = ({ studentId, isOpen, onClose }: AchievementShowcaseProps) => {
  const { getAllAchievementsWithStatus, getTotalStats, isLoading } = usePlayerAchievements(studentId);

  const achievements = getAllAchievementsWithStatus();
  const stats = getTotalStats();

  const categories = Object.keys(ACHIEVEMENT_CATEGORIES) as AchievementCategory[];

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
          className="bg-gradient-to-br from-slate-900 via-indigo-900/50 to-slate-900 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-hidden border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.3)] flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <Trophy className="w-7 h-7 text-yellow-500" />
                  Achievements
                </h2>
                <p className="text-sm text-indigo-300">
                  {stats.unlocked} / {stats.total} unlocked ({stats.percentage}%)
                </p>
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

            {/* Progress Bar */}
            <div className="mb-4">
              <Progress value={stats.percentage} className="h-3 bg-slate-700" />
              <div className="flex justify-between mt-1 text-xs text-slate-400">
                <span>Total earned: {stats.totalGold} gold, {stats.totalXp} XP</span>
                <span>{stats.total - stats.unlocked} remaining</span>
              </div>
            </div>

            {/* Category Tabs */}
            <Tabs defaultValue="reading" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="bg-slate-800/50 border border-slate-700 p-1 mb-4">
                {categories.map((category) => {
                  const categoryAchievements = achievements.filter(a => a.category === category);
                  const categoryUnlocked = categoryAchievements.filter(a => a.isUnlocked).length;
                  
                  return (
                    <TabsTrigger
                      key={category}
                      value={category}
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 text-xs px-3"
                    >
                      {ACHIEVEMENT_CATEGORIES[category].label}
                      <span className="ml-1 text-xs opacity-70">
                        ({categoryUnlocked}/{categoryAchievements.length})
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {categories.map((category) => (
                <TabsContent 
                  key={category} 
                  value={category} 
                  className="flex-1 overflow-y-auto pr-2 mt-0"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {achievements
                      .filter(a => a.category === category)
                      .map((achievement) => {
                        const Icon = achievement.icon;
                        
                        return (
                          <motion.div
                            key={achievement.id}
                            whileHover={{ scale: 1.02 }}
                            className={`relative rounded-xl p-3 transition-all ${
                              achievement.isUnlocked
                                ? `bg-gradient-to-br ${achievement.gradient} bg-opacity-20 border-2 ${getRarityBorder(achievement.rarity)}`
                                : 'bg-slate-800/50 border border-slate-700/50 opacity-60'
                            }`}
                          >
                            {/* Badge Icon */}
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                                  achievement.isUnlocked
                                    ? `bg-gradient-to-br ${achievement.gradient} shadow-lg`
                                    : 'bg-slate-700'
                                }`}
                                style={achievement.isUnlocked ? { boxShadow: `0 4px 15px ${achievement.shadowColor}` } : {}}
                              >
                                {achievement.isUnlocked ? (
                                  <Icon className="w-6 h-6 text-white" />
                                ) : (
                                  <Lock className="w-5 h-5 text-slate-500" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h3 className={`font-bold text-sm truncate ${
                                  achievement.isUnlocked ? 'text-white' : 'text-slate-400'
                                }`}>
                                  {achievement.name}
                                </h3>
                                <p className="text-xs text-slate-400 line-clamp-2">
                                  {achievement.description}
                                </p>
                              </div>
                            </div>

                            {/* Rarity Badge */}
                            <div className={`absolute top-2 right-2 text-xs font-bold uppercase ${getRarityColor(achievement.rarity)}`}>
                              {achievement.rarity}
                            </div>

                            {/* Rewards */}
                            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/10">
                              <div className="flex items-center gap-1 text-xs">
                                <Coins className="w-3 h-3 text-yellow-400" />
                                <span className="text-yellow-400">+{achievement.reward.gold}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <Star className="w-3 h-3 text-purple-400" />
                                <span className="text-purple-400">+{achievement.reward.xp}</span>
                              </div>
                              {achievement.isUnlocked && achievement.unlockedAt && (
                                <span className="text-xs text-slate-500 ml-auto">
                                  {new Date(achievement.unlockedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
