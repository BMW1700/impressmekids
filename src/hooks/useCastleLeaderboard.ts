import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredTheme, getGradeMode } from "@/lib/gameTheme";

export type LeaderboardScope = "week" | "all_time";

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  best_wave: number;
  best_words: number;
  best_accuracy: number;
  achieved_at: string;
}

export function useCastleLeaderboard(scope: LeaderboardScope = "all_time", limit = 25) {
  const { user } = useAuth();
  const gradeMode = getGradeMode(getStoredTheme());
  return useQuery({
    queryKey: ["castle-endless-leaderboard", gradeMode, scope, limit],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase.rpc("get_castle_endless_leaderboard", {
        p_grade_mode: gradeMode,
        p_scope: scope,
        p_limit: limit,
      });
      if (error) { console.error("[castle-leaderboard]", error); return []; }
      return (data || []) as LeaderboardEntry[];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}
