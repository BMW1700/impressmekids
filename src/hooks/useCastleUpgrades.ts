import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredTheme, getGradeMode } from "@/lib/gameTheme";

export type UpgradeTrack = "hp_level" | "damage_level" | "cap_level";

export interface UpgradesRow {
  hp_level: number;
  damage_level: number;
  cap_level: number;
}

const COST_TABLE = [50, 120, 250, 500, 1000];

export function upgradeCost(level: number): number | null {
  if (level >= COST_TABLE.length) return null;
  return COST_TABLE[level];
}

/** Effective stats given the current upgrade row. */
export function effectiveKnightStats(u: UpgradesRow) {
  return {
    knightHp: 3 + u.hp_level,                    // 3..8
    knightDps: 2 + u.damage_level * 0.6,         // 2..5
    summonCap: 4 + u.cap_level,                  // 4..9
  };
}

export function useCastleUpgrades() {
  const { user } = useAuth();
  const gradeMode = getGradeMode(getStoredTheme());
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["castle-upgrades", user?.id, gradeMode],
    queryFn: async (): Promise<UpgradesRow> => {
      if (!user?.id) return { hp_level: 0, damage_level: 0, cap_level: 0 };
      const { data, error } = await supabase
        .from("castle_upgrades")
        .select("hp_level, damage_level, cap_level")
        .eq("user_id", user.id)
        .eq("grade_mode", gradeMode)
        .maybeSingle();
      if (error) { console.error("[castle-upgrades] load", error); }
      return (data as UpgradesRow) || { hp_level: 0, damage_level: 0, cap_level: 0 };
    },
    enabled: !!user?.id,
  });

  const buy = useMutation({
    mutationFn: async ({ track, cost }: { track: UpgradeTrack; cost: number }) => {
      if (!user?.id) throw new Error("Not signed in");
      const { data, error } = await supabase.rpc("purchase_castle_upgrade", {
        p_grade_mode: gradeMode,
        p_track: track,
        p_cost: cost,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; balance?: number; new_level?: number };
      if (!result?.success) throw new Error(result?.error || "Purchase failed");
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["castle-upgrades", user?.id, gradeMode] });
      qc.invalidateQueries({ queryKey: ["campaign-progress", user?.id, gradeMode] });
      qc.invalidateQueries({ queryKey: ["campaign-progress", user?.id] });
    },
  });

  return {
    upgrades: query.data || { hp_level: 0, damage_level: 0, cap_level: 0 },
    stats: effectiveKnightStats(query.data || { hp_level: 0, damage_level: 0, cap_level: 0 }),
    buy: buy.mutateAsync,
    isBuying: buy.isPending,
    isLoading: query.isLoading,
  };
}
