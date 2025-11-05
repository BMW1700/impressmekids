import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardEntry {
  student_id: string;
  student_name: string;
  avatar_url: string | null;
  grade: number | null;
  games_won: number;
  assignments_completed: number;
  aura_avg_score: number;
  total_score: number;
}

export const useClassroomLeaderboard = (classroomId: string | undefined) => {
  return useQuery({
    queryKey: ["classroom-leaderboard", classroomId],
    queryFn: async () => {
      if (!classroomId) return null;

      const { data, error } = await supabase.rpc("get_classroom_leaderboard", {
        _classroom_id: classroomId,
      });

      if (error) throw error;
      return data as LeaderboardEntry[];
    },
    enabled: !!classroomId,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
};
