import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ACHIEVEMENTS, getAchievementById, Achievement } from "@/lib/achievementsData";

interface PlayerAchievement {
  id: string;
  student_id: string;
  achievement_id: string;
  achievement_category: string;
  unlocked_at: string;
  metadata: Record<string, any>;
}

export const usePlayerAchievements = (studentId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all unlocked achievements
  const { data: unlockedAchievements = [], isLoading } = useQuery({
    queryKey: ["player-achievements", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_achievements")
        .select("*")
        .eq("student_id", studentId!)
        .order("unlocked_at", { ascending: false });

      if (error) throw error;
      return data as PlayerAchievement[];
    },
    enabled: !!studentId,
  });

  // Get unlocked achievement IDs for quick lookup
  const unlockedIds = new Set(unlockedAchievements.map(a => a.achievement_id));

  // Check if an achievement is unlocked
  const isUnlocked = (achievementId: string): boolean => {
    return unlockedIds.has(achievementId);
  };

  // Get all achievements with unlock status
  const getAllAchievementsWithStatus = () => {
    return ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      isUnlocked: isUnlocked(achievement.id),
      unlockedAt: unlockedAchievements.find(a => a.achievement_id === achievement.id)?.unlocked_at,
    }));
  };

  // Unlock an achievement
  const unlockAchievement = useMutation({
    mutationFn: async ({ achievementId, metadata = {} }: { achievementId: string; metadata?: Record<string, any> }) => {
      if (!studentId) throw new Error("No student ID");
      
      const achievement = getAchievementById(achievementId);
      if (!achievement) throw new Error("Achievement not found");
      
      if (isUnlocked(achievementId)) {
        return null; // Already unlocked
      }

      const { data, error } = await supabase
        .from("player_achievements")
        .insert({
          student_id: studentId,
          achievement_id: achievementId,
          achievement_category: achievement.category,
          metadata,
        })
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation (already unlocked)
        if (error.code === '23505') return null;
        throw error;
      }

      return { achievement, record: data };
    },
    onSuccess: (result) => {
      if (result) {
        queryClient.invalidateQueries({ queryKey: ["player-achievements", studentId] });
        queryClient.invalidateQueries({ queryKey: ["campaign-progress", studentId] });
        
        toast({
          title: "🏆 Achievement Unlocked!",
          description: `${result.achievement.name}: +${result.achievement.reward.gold} gold, +${result.achievement.reward.xp} XP`,
        });
      }
    },
  });

  // Check and unlock achievements based on stats
  const checkAchievements = useMutation({
    mutationFn: async (stats: {
      wordsRead?: number;
      wordStreak?: number;
      loginStreak?: number;
      battlesWon?: number;
      flawlessBattles?: number;
      bossesDefeated?: number;
      accuracy?: number;
      worldsCompleted?: number;
      purchases?: number;
      itemsOwned?: number;
      totalGold?: number;
      petsOwned?: number;
    }) => {
      if (!studentId) return [];

      const newlyUnlocked: Achievement[] = [];

      for (const achievement of ACHIEVEMENTS) {
        if (isUnlocked(achievement.id)) continue;

        let shouldUnlock = false;
        const { type, value } = achievement.requirement;

        switch (type) {
          case 'words_read':
            shouldUnlock = (stats.wordsRead || 0) >= value;
            break;
          case 'word_streak':
            shouldUnlock = (stats.wordStreak || 0) >= value;
            break;
          case 'login_streak':
            shouldUnlock = (stats.loginStreak || 0) >= value;
            break;
          case 'battles_won':
            shouldUnlock = (stats.battlesWon || 0) >= value;
            break;
          case 'flawless_battles':
            shouldUnlock = (stats.flawlessBattles || 0) >= value;
            break;
          case 'bosses_defeated':
            shouldUnlock = (stats.bossesDefeated || 0) >= value;
            break;
          case 'accuracy':
            shouldUnlock = (stats.accuracy || 0) >= value;
            break;
          case 'worlds_completed':
            shouldUnlock = (stats.worldsCompleted || 0) >= value;
            break;
          case 'purchases':
            shouldUnlock = (stats.purchases || 0) >= value;
            break;
          case 'items_owned':
            shouldUnlock = (stats.itemsOwned || 0) >= value;
            break;
          case 'total_gold':
            shouldUnlock = (stats.totalGold || 0) >= value;
            break;
          case 'pets_owned':
            shouldUnlock = (stats.petsOwned || 0) >= value;
            break;
        }

        if (shouldUnlock) {
          try {
            const { error } = await supabase
              .from("player_achievements")
              .insert({
                student_id: studentId,
                achievement_id: achievement.id,
                achievement_category: achievement.category,
                metadata: { stats },
              });

            if (!error) {
              newlyUnlocked.push(achievement);
            }
          } catch {
            // Ignore duplicates
          }
        }
      }

      return newlyUnlocked;
    },
    onSuccess: (newlyUnlocked) => {
      if (newlyUnlocked.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["player-achievements", studentId] });
        
        // Show toast for each unlocked achievement
        newlyUnlocked.forEach(achievement => {
          toast({
            title: "🏆 Achievement Unlocked!",
            description: `${achievement.name}: ${achievement.description}`,
          });
        });
      }
    },
  });

  // Get achievement progress for display
  const getAchievementProgress = (achievementId: string, currentValue: number): number => {
    const achievement = getAchievementById(achievementId);
    if (!achievement) return 0;
    return Math.min(100, (currentValue / achievement.requirement.value) * 100);
  };

  // Get total achievement stats
  const getTotalStats = () => {
    const total = ACHIEVEMENTS.length;
    const unlocked = unlockedAchievements.length;
    const percentage = Math.round((unlocked / total) * 100);
    
    // Calculate total rewards earned
    const totalGold = unlockedAchievements.reduce((sum, ua) => {
      const achievement = getAchievementById(ua.achievement_id);
      return sum + (achievement?.reward.gold || 0);
    }, 0);
    
    const totalXp = unlockedAchievements.reduce((sum, ua) => {
      const achievement = getAchievementById(ua.achievement_id);
      return sum + (achievement?.reward.xp || 0);
    }, 0);

    return { total, unlocked, percentage, totalGold, totalXp };
  };

  return {
    unlockedAchievements,
    isLoading,
    isUnlocked,
    getAllAchievementsWithStatus,
    unlockAchievement: unlockAchievement.mutate,
    checkAchievements: checkAchievements.mutate,
    getAchievementProgress,
    getTotalStats,
  };
};
