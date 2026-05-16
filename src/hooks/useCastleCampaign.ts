import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredTheme, getGradeMode } from "@/lib/gameTheme";

export interface CampaignProgressRow {
  level_id: string;
  stars: number;
  best_wave: number;
  best_accuracy: number;
  best_words_read: number;
  completed_at: string | null;
}

export function useCastleCampaign() {
  const { user } = useAuth();
  const gradeMode = getGradeMode(getStoredTheme());
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["castle-campaign", user?.id, gradeMode],
    queryFn: async (): Promise<CampaignProgressRow[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("castle_swarm_campaign_progress")
        .select("level_id, stars, best_wave, best_accuracy, best_words_read, completed_at")
        .eq("user_id", user.id)
        .eq("grade_mode", gradeMode);
      if (error) { console.error("[castle-campaign] load", error); return []; }
      return (data || []) as CampaignProgressRow[];
    },
    enabled: !!user?.id,
  });

  const upsert = useMutation({
    mutationFn: async (row: { level_id: string; stars: number; wave: number; accuracy: number; words_read: number; won: boolean }) => {
      if (!user?.id) return;
      const existing = (query.data || []).find(r => r.level_id === row.level_id);
      const newStars = Math.max(row.stars, existing?.stars ?? 0);
      const payload = {
        user_id: user.id,
        grade_mode: gradeMode,
        level_id: row.level_id,
        stars: newStars,
        best_wave: Math.max(row.wave, existing?.best_wave ?? 0),
        best_accuracy: Math.max(row.accuracy, existing?.best_accuracy ?? 0),
        best_words_read: Math.max(row.words_read, existing?.best_words_read ?? 0),
        completed_at: row.won ? new Date().toISOString() : existing?.completed_at ?? null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("castle_swarm_campaign_progress")
        .upsert(payload, { onConflict: "user_id,grade_mode,level_id" });
      if (error) console.error("[castle-campaign] save", error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["castle-campaign", user?.id, gradeMode] }),
  });

  const byLevel = new Map((query.data || []).map(r => [r.level_id, r]));

  /** A level is unlocked if its index is 0 OR the previous level has any stars. */
  const isUnlocked = (allLevelIds: string[], levelId: string) => {
    const idx = allLevelIds.indexOf(levelId);
    if (idx <= 0) return true;
    const prev = byLevel.get(allLevelIds[idx - 1]);
    return !!prev && prev.stars > 0;
  };

  /** Endless unlocks after completing 5 campaign levels. */
  const endlessUnlocked = (query.data || []).filter(r => r.stars > 0).length >= 5;

  return { progress: query.data || [], byLevel, isUnlocked, endlessUnlocked, save: upsert.mutate, isLoading: query.isLoading };
}
