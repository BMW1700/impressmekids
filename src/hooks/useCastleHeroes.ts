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
interface HeroUpgradeRow { hero_id: string; level: number }

export function useCastleHeroes() {
  const { user } = useAuth();
  const gradeMode = getGradeMode(getStoredTheme());
  const qc = useQueryClient();

  const queryKey = ["castle-heroes", user?.id, gradeMode] as const;
  const upgradeQueryKey = ["castle-hero-upgrades", user?.id, gradeMode] as const;

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

  const upgradeQuery = useQuery({
    queryKey: upgradeQueryKey,
    queryFn: async (): Promise<HeroUpgradeRow[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("castle_hero_upgrades" as any)
        .select("hero_id, level")
        .eq("user_id", user.id)
        .eq("grade_mode", gradeMode);
      if (error) { console.error("[castle-hero-upgrades] load", error); return []; }
      return (data as unknown as HeroUpgradeRow[]) || [];
    },
    enabled: !!user?.id,
  });

  const heroLevels = useMemo(() => {
    const levels: Record<string, number> = {};
    for (const id of STARTER_HERO_IDS) levels[id] = 0;
    for (const r of upgradeQuery.data || []) levels[r.hero_id] = Math.max(0, Math.min(5, Number(r.level) || 0));
    return levels;
  }, [upgradeQuery.data]);

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

  const buyShopUnlock = useMutation({
    mutationFn: async ({ heroId, cost }: { heroId: string; cost: number }) => {
      if (!user?.id) throw new Error("Not signed in");
      const { data, error } = await supabase.rpc("purchase_castle_hero_unlock" as any, {
        p_grade_mode: gradeMode,
        p_hero_id: heroId,
        p_cost: cost,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; balance?: number; hero_id?: string };
      if (!result?.success) throw new Error(result?.error || "Purchase failed");
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["campaign-progress", user?.id, gradeMode] });
    },
  });

  const buyHeroLevel = useMutation({
    mutationFn: async ({ heroId, cost }: { heroId: string; cost: number }) => {
      if (!user?.id) throw new Error("Not signed in");
      const { data, error } = await supabase.rpc("purchase_castle_hero_level" as any, {
        p_grade_mode: gradeMode,
        p_hero_id: heroId,
        p_cost: cost,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; balance?: number; new_level?: number; hero_id?: string };
      if (!result?.success) throw new Error(result?.error || "Upgrade failed");
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: upgradeQueryKey });
      qc.invalidateQueries({ queryKey: ["campaign-progress", user?.id, gradeMode] });
    },
  });

  const isUnlocked = useCallback((heroId: string) => unlockedIds.has(heroId), [unlockedIds]);

  return {
    isLoading: query.isLoading,
    roster: HERO_ROSTER,
    shopHeroIds: SHOP_HERO_IDS,
    unlockedIds,
    heroLevels,
    isUnlocked,
    /** Persist a campaign-reward unlock (idempotent). */
    unlockFromCampaign: (heroId: string) => unlock.mutateAsync({ heroId, source: "campaign" }),
    /** Persist a shop purchase. */
    unlockFromShop: (heroId: string) => unlock.mutateAsync({ heroId, source: "shop" }),
    buyShopUnlock: (heroId: string, cost: number) => buyShopUnlock.mutateAsync({ heroId, cost }),
    buyHeroLevel: (heroId: string, cost: number) => buyHeroLevel.mutateAsync({ heroId, cost }),
  };
}
