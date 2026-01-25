import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BossRushAttempt {
  id: string;
  student_id: string;
  started_at: string;
  ended_at: string | null;
  status: "in_progress" | "completed" | "failed";
  current_boss_index: number;
  bosses_defeated: number;
  total_damage_dealt: number;
  total_words_read: number;
  total_xp_earned: number;
  total_gold_earned: number;
  longest_streak: number;
  time_taken_seconds: number | null;
}

export const useBossRush = (studentId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current in-progress attempt
  const { data: currentAttempt, isLoading: attemptLoading } = useQuery({
    queryKey: ["boss-rush-attempt", studentId],
    queryFn: async () => {
      if (!studentId) return null;

      const { data, error } = await supabase
        .from("boss_rush_attempts")
        .select("*")
        .eq("student_id", studentId)
        .eq("status", "in_progress")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as BossRushAttempt | null;
    },
    enabled: !!studentId,
  });

  // Fetch best completed attempt
  const { data: bestAttempt } = useQuery({
    queryKey: ["boss-rush-best", studentId],
    queryFn: async () => {
      if (!studentId) return null;

      const { data, error } = await supabase
        .from("boss_rush_attempts")
        .select("*")
        .eq("student_id", studentId)
        .eq("status", "completed")
        .order("time_taken_seconds", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as BossRushAttempt | null;
    },
    enabled: !!studentId,
  });

  // Fetch all completed attempts for stats
  const { data: completedAttempts } = useQuery({
    queryKey: ["boss-rush-history", studentId],
    queryFn: async () => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from("boss_rush_attempts")
        .select("*")
        .eq("student_id", studentId)
        .in("status", ["completed", "failed"])
        .order("started_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as BossRushAttempt[];
    },
    enabled: !!studentId,
  });

  // Start a new Boss Rush attempt
  const startAttempt = useMutation({
    mutationFn: async () => {
      if (!studentId) throw new Error("No student ID");

      const { data, error } = await supabase
        .from("boss_rush_attempts")
        .insert({
          student_id: studentId,
          status: "in_progress",
          current_boss_index: 0,
          bosses_defeated: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BossRushAttempt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boss-rush-attempt", studentId] });
      toast({
        title: "⚔️ Boss Rush Started!",
        description: "Defeat all 9 bosses to prove your mastery!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start Boss Rush. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update attempt after defeating a boss
  const defeatBoss = useMutation({
    mutationFn: async ({
      attemptId,
      damageDealt,
      wordsRead,
      xpEarned,
      goldEarned,
      longestStreak,
    }: {
      attemptId: string;
      damageDealt: number;
      wordsRead: number;
      xpEarned: number;
      goldEarned: number;
      longestStreak: number;
    }) => {
      // Get current attempt to update values
      const { data: current, error: fetchError } = await supabase
        .from("boss_rush_attempts")
        .select("*")
        .eq("id", attemptId)
        .single();

      if (fetchError) throw fetchError;

      const newBossIndex = current.current_boss_index + 1;
      const newBossesDefeated = current.bosses_defeated + 1;
      const isComplete = newBossIndex >= 9; // All 9 bosses defeated

      const startTime = new Date(current.started_at).getTime();
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);

      const { data, error } = await supabase
        .from("boss_rush_attempts")
        .update({
          current_boss_index: newBossIndex,
          bosses_defeated: newBossesDefeated,
          total_damage_dealt: current.total_damage_dealt + damageDealt,
          total_words_read: current.total_words_read + wordsRead,
          total_xp_earned: current.total_xp_earned + xpEarned,
          total_gold_earned: current.total_gold_earned + goldEarned,
          longest_streak: Math.max(current.longest_streak, longestStreak),
          status: isComplete ? "completed" : "in_progress",
          ended_at: isComplete ? new Date().toISOString() : null,
          time_taken_seconds: isComplete ? timeTaken : null,
        })
        .eq("id", attemptId)
        .select()
        .single();

      if (error) throw error;

      // If completed, update campaign progress
      if (isComplete) {
        const { data: progress } = await supabase
          .from("campaign_progress")
          .select("boss_rush_completions, boss_rush_best_time_seconds")
          .eq("student_id", studentId)
          .single();

        const currentBest = progress?.boss_rush_best_time_seconds;
        const newBest = !currentBest || timeTaken < currentBest ? timeTaken : currentBest;

        await supabase
          .from("campaign_progress")
          .update({
            boss_rush_completions: (progress?.boss_rush_completions || 0) + 1,
            boss_rush_best_time_seconds: newBest,
          })
          .eq("student_id", studentId);
      }

      return { attempt: data as BossRushAttempt, isComplete };
    },
    onSuccess: ({ isComplete }) => {
      queryClient.invalidateQueries({ queryKey: ["boss-rush-attempt", studentId] });
      queryClient.invalidateQueries({ queryKey: ["boss-rush-best", studentId] });
      queryClient.invalidateQueries({ queryKey: ["boss-rush-history", studentId] });
      queryClient.invalidateQueries({ queryKey: ["campaign-progress", studentId] });

      if (isComplete) {
        toast({
          title: "🏆 BOSS RUSH COMPLETE!",
          description: "You've conquered all 9 bosses! Legendary!",
        });
      } else {
        toast({
          title: "💀 Boss Defeated!",
          description: "On to the next challenger!",
        });
      }
    },
  });

  // Fail/abandon the current attempt
  const abandonAttempt = useMutation({
    mutationFn: async (attemptId: string) => {
      const { data: current } = await supabase
        .from("boss_rush_attempts")
        .select("started_at")
        .eq("id", attemptId)
        .single();

      const startTime = new Date(current?.started_at || Date.now()).getTime();
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);

      const { error } = await supabase
        .from("boss_rush_attempts")
        .update({
          status: "failed",
          ended_at: new Date().toISOString(),
          time_taken_seconds: timeTaken,
        })
        .eq("id", attemptId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boss-rush-attempt", studentId] });
      queryClient.invalidateQueries({ queryKey: ["boss-rush-history", studentId] });
      toast({
        title: "Boss Rush Ended",
        description: "Better luck next time, hero!",
      });
    },
  });

  return {
    currentAttempt,
    bestAttempt,
    completedAttempts,
    attemptLoading,
    startAttempt: startAttempt.mutateAsync,
    defeatBoss: defeatBoss.mutateAsync,
    abandonAttempt: abandonAttempt.mutateAsync,
  };
};
