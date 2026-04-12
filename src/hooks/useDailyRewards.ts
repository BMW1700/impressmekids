import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getRewardForDay, getMilestoneReward } from "@/lib/dailyRewardsData";

interface DailyLoginReward {
  id: string;
  student_id: string;
  login_date: string;
  streak_day: number;
  reward_gold: number;
  reward_xp: number;
  bonus_reward: Record<string, any> | null;
  claimed_at: string;
}

export const useDailyRewards = (studentId?: string, gradeMode?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch login history for the last 30 days
  const { data: loginHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["daily-login-history", studentId],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("daily_login_rewards")
        .select("*")
        .eq("student_id", studentId!)
        .gte("login_date", thirtyDaysAgo.toISOString().split('T')[0])
        .order("login_date", { ascending: false });

      if (error) throw error;
      return data as DailyLoginReward[];
    },
    enabled: !!studentId,
  });

  // Get current streak info from campaign_progress — scoped by gradeMode
  const { data: streakInfo, isLoading: streakLoading } = useQuery({
    queryKey: ["login-streak-info", studentId, gradeMode],
    queryFn: async () => {
      let query = supabase
        .from("campaign_progress")
        .select("login_streak, longest_login_streak, last_login_date, total_gold, grade_mode")
        .eq("student_id", studentId!);
      if (gradeMode) {
        query = query.eq("grade_mode", gradeMode);
      }
      const { data, error } = await query.order("updated_at", { ascending: false }).limit(1).maybeSingle();

      if (error) throw error;
      return data || { login_streak: 0, longest_login_streak: 0, last_login_date: null, total_gold: 0, grade_mode: gradeMode || 'k5' };
    },
    enabled: !!studentId,
  });

  // Check if today's reward has been claimed
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysClaim = loginHistory.find(l => l.login_date === todayStr);
  const hasClaimedToday = !!todaysClaim;

  // Calculate if streak is still active (claimed yesterday or today)
  const isStreakActive = () => {
    if (!streakInfo?.last_login_date) return false;
    const lastLogin = new Date(streakInfo.last_login_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastLogin.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 1;
  };

  // Claim daily reward
  const claimDailyReward = useMutation({
    mutationFn: async () => {
      if (!studentId) throw new Error("No student ID");
      if (hasClaimedToday) throw new Error("Already claimed today");

      // Calculate new streak
      const currentStreak = isStreakActive() ? (streakInfo?.login_streak || 0) + 1 : 1;
      const longestStreak = Math.max(currentStreak, streakInfo?.longest_login_streak || 0);
      
      // Get reward for this streak day
      const reward = getRewardForDay(currentStreak);
      const milestone = getMilestoneReward(currentStreak);
      
      // Calculate total reward including milestone
      const totalGold = reward.gold + (milestone?.gold || 0);
      const totalXp = reward.xp + (milestone?.xp || 0);

      // Insert login reward record
      const { error: rewardError } = await supabase
        .from("daily_login_rewards")
        .insert({
          student_id: studentId,
          login_date: todayStr,
          streak_day: currentStreak,
          reward_gold: totalGold,
          reward_xp: totalXp,
          bonus_reward: reward.bonus ? { type: reward.bonus.type, label: reward.bonus.label } : null,
        });

      if (rewardError) throw rewardError;

      // Update campaign_progress with new streak info — scoped by gradeMode
      const upsertData = {
        student_id: studentId,
        grade_mode: gradeMode || streakInfo?.grade_mode || 'k5',
        login_streak: currentStreak,
        longest_login_streak: longestStreak,
        last_login_date: todayStr,
        total_gold: (streakInfo?.total_gold || 0) + totalGold,
      };

      const { error: progressError } = await supabase
        .from("campaign_progress")
        .upsert(upsertData, {
          onConflict: 'student_id,grade_mode',
        } as any);

      if (progressError) throw progressError;

      return {
        streakDay: currentStreak,
        gold: totalGold,
        xp: totalXp,
        bonus: reward.bonus,
        milestone,
        isNewLongest: currentStreak > (streakInfo?.longest_login_streak || 0),
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["daily-login-history", studentId] });
      queryClient.invalidateQueries({ queryKey: ["login-streak-info", studentId, gradeMode] });
      queryClient.invalidateQueries({ queryKey: ["campaign-progress", studentId] });
      
      let message = `Day ${data.streakDay} reward: +${data.gold} gold, +${data.xp} XP!`;
      if (data.bonus) {
        message += ` Bonus: ${data.bonus.label}!`;
      }
      if (data.milestone) {
        message = `🎉 ${data.milestone.label} ${message}`;
      }
      
      toast({
        title: data.isNewLongest ? "🌟 New Streak Record!" : "✨ Daily Reward Claimed!",
        description: message,
      });
    },
    onError: (error) => {
      console.error("Failed to claim daily reward:", error);
      toast({
        title: "Error",
        description: "Failed to claim daily reward",
        variant: "destructive",
      });
    },
  });

  return {
    loginHistory,
    historyLoading,
    streakInfo: streakInfo || { login_streak: 0, longest_login_streak: 0, last_login_date: null, total_gold: 0 },
    streakLoading,
    hasClaimedToday,
    isStreakActive: isStreakActive(),
    currentStreak: streakInfo?.login_streak || 0,
    longestStreak: streakInfo?.longest_login_streak || 0,
    claimDailyReward: claimDailyReward.mutate,
    isClaimingReward: claimDailyReward.isPending,
  };
};