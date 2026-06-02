import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredTheme, getGradeMode } from "@/lib/gameTheme";
import {
  HERO_ROSTER, HEROES_BY_ID, STARTER_HERO_IDS, SHOP_HERO_IDS,
} from "@/components/aura/game/castle/heroes/heroRoster";

type UnlockSource = "campaign" | "shop" | "starter";

interface UnlockedRow { hero_id: string; source: UnlockSource }

export function useCastleHeroes() {
  const { user } = useAuth();
  const gradeMode = getGradeMode(getStoredTheme());
  const qc = useQueryClient();

  const queryKey = ["castle-heroes", user?.id, gradeMode] as const;

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<UnlockedRow[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("castle_unlocked_heroes")
        .select("hero_id, source")
        .eq("user_id", user.id)
        .eq("grade_mode", gradeMode);
      if (error) { console.error("[castle-heroes] load", error); return []; }
      return (data as UnlockedRow[]) || [];
    },
    enabled: !!user?.id,
  });

  /** Set of hero ids the player can summon right now (starters always included). */
  const unlockedIds = useMemo(() => {
    const s = new Set<string>(STARTER_HERO_IDS);
    for (const r of query.data || []) s.add(r.hero_id);
    return s;
  }, [query.data]);

  const unlock = useMutation({
    mutationFn: async (args: { heroId: string; source: UnlockSource }) => {
      if (!user?.id) return;
      const def = HEROES_BY_ID[args.heroId];
      if (!def) return;
      if (STARTER_HERO_IDS.includes(args.heroId)) return; // no-op for starters
      const { error } = await supabase
        .from("castle_unlocked_heroes")
        .upsert(
          {
            user_id: user.id,
            grade_mode: gradeMode,
            hero_id: args.heroId,
            source: args.source,
          },
          { onConflict: "user_id,grade_mode,hero_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const isUnlocked = useCallback((heroId: string) => unlockedIds.has(heroId), [unlockedIds]);

  return {
    isLoading: query.isLoading,
    roster: HERO_ROSTER,
    shopHeroIds: SHOP_HERO_IDS,
    unlockedIds,
    isUnlocked,
    /** Persist a campaign-reward unlock (idempotent). */
    unlockFromCampaign: (heroId: string) => unlock.mutateAsync({ heroId, source: "campaign" }),
    /** Persist a shop purchase. */
    unlockFromShop: (heroId: string) => unlock.mutateAsync({ heroId, source: "shop" }),
  };
}
