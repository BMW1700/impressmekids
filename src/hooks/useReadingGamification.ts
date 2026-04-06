import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Achievement {
  id: string;
  achievement_type: string;
  earned_at: string;
  metadata: Record<string, any>;
}

interface Mission {
  id: string;
  mission_type: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  status: string;
  expires_at?: string;
}

export const useReadingGamification = (studentId?: string, gradeMode?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch achievements
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ["reading-achievements", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reading_achievements")
        .select("*")
        .eq("student_id", studentId!)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      return data as Achievement[];
    },
    enabled: !!studentId,
  });

  // Fetch streak from student_reading_stats — scoped by gradeMode
  const { data: streak, isLoading: streakLoading } = useQuery({
    queryKey: ["reading-streak", studentId, gradeMode],
    queryFn: async () => {
      let query = supabase
        .from("student_reading_stats")
        .select("current_streak_days, longest_streak_days, last_activity_date")
        .eq("student_id", studentId!);
      if (gradeMode) query = query.eq("grade_mode", gradeMode);
      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data ? {
        current_streak: data.current_streak_days,
        longest_streak: data.longest_streak_days,
        last_reading_date: data.last_activity_date
      } : { current_streak: 0, longest_streak: 0, last_reading_date: null };
    },
    enabled: !!studentId,
  });

  // Fetch missions
  const { data: missions = [], isLoading: missionsLoading } = useQuery({
    queryKey: ["reading-missions", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reading_missions")
        .select("*")
        .eq("student_id", studentId!)
        .in("status", ["active", "completed"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Mission[];
    },
    enabled: !!studentId,
  });

  // Update streak - streak logic is handled by updateStudentStats in WordByWordReader
  const updateStreak = useMutation({
    mutationFn: async () => {
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reading-streak", studentId, gradeMode] });
    },
  });

  // Award achievement
  const awardAchievement = useMutation({
    mutationFn: async ({ achievementType, metadata = {} }: { achievementType: string; metadata?: Record<string, any> }) => {
      const { data, error } = await supabase
        .from("reading_achievements")
        .insert({
          student_id: studentId!,
          achievement_type: achievementType,
          metadata,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reading-achievements", studentId] });
      toast({
        title: "Achievement Unlocked! 🏆",
        description: `You earned: ${data.achievement_type.replace('_', ' ')}`,
      });
    },
  });

  // Update mission progress
  const updateMissionProgress = useMutation({
    mutationFn: async ({ missionId, newValue }: { missionId: string; newValue: number }) => {
      const { data: mission } = await supabase
        .from("reading_missions")
        .select("*")
        .eq("id", missionId)
        .single();

      if (!mission) throw new Error("Mission not found");

      const status = newValue >= mission.target_value ? "completed" : "active";
      const completedAt = status === "completed" ? new Date().toISOString() : null;

      const { error } = await supabase
        .from("reading_missions")
        .update({
          current_value: newValue,
          status,
          completed_at: completedAt,
        })
        .eq("id", missionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reading-missions", studentId] });
    },
  });

  return {
    achievements,
    achievementsLoading,
    streak: streak || { current_streak: 0, longest_streak: 0, last_reading_date: null },
    streakLoading,
    missions,
    missionsLoading,
    updateStreak: updateStreak.mutate,
    awardAchievement: awardAchievement.mutate,
    updateMissionProgress: updateMissionProgress.mutate,
  };
};