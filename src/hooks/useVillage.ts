import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface VillageZone {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  unlock_requirement: Record<string, unknown>;
  sort_order: number;
}

export interface VillageItem {
  id: string;
  slug: string;
  name: string;
  zone_id: string | null;
  image_url: string | null;
  rarity: string;
  unlock_requirement: Record<string, unknown>;
  token_cost: number;
  gold_cost: number;
  sort_order: number;
}

export interface PlayerVillageState {
  user_id: string;
  unlocked_zone_ids: string[];
  owned_item_ids: string[];
  placed_items: Record<string, string>; // slotId -> itemId
  tokens: number;
  last_village_visit_at: string | null;
}

const EMPTY_STATE = (userId: string): PlayerVillageState => ({
  user_id: userId,
  unlocked_zone_ids: [],
  owned_item_ids: [],
  placed_items: {},
  tokens: 0,
  last_village_visit_at: null,
});

export function useVillageZones() {
  return useQuery({
    queryKey: ["village-zones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("village_zones")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as VillageZone[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useVillageItems() {
  return useQuery({
    queryKey: ["village-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("village_items")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as VillageItem[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlayerVillageState(userId?: string) {
  return useQuery({
    queryKey: ["player-village-state", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_village_state")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return EMPTY_STATE(userId!);
      return {
        ...data,
        placed_items: (data.placed_items as Record<string, string>) ?? {},
        unlocked_zone_ids: data.unlocked_zone_ids ?? [],
        owned_item_ids: data.owned_item_ids ?? [],
      } as PlayerVillageState;
    },
  });
}

/** Award tokens + sync zone unlocks. Called after a Pre-K level completes. */
export async function awardVillageProgress(userId: string, tokens = 1) {
  const { data, error } = await supabase.rpc("award_village_progress", {
    _user_id: userId,
    _tokens: tokens,
  });
  if (error) {
    console.error("[village] award failed", error);
    return null;
  }
  return data;
}

export function usePurchaseVillageItem(userId?: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({
      item,
      currentTokens,
      currentGold,
      ownedIds,
    }: {
      item: VillageItem;
      currentTokens: number;
      currentGold: number;
      ownedIds: string[];
    }) => {
      if (!userId) throw new Error("Not signed in");
      if (ownedIds.includes(item.id)) throw new Error("Already owned");
      if (currentTokens < item.token_cost) throw new Error("Not enough Village Tokens");
      if (currentGold < item.gold_cost) throw new Error("Not enough Gold");

      // Deduct gold from student_profiles.stats.gold (best-effort, server is source of truth elsewhere)
      if (item.gold_cost > 0) {
        const { data: prof } = await supabase
          .from("student_profiles")
          .select("stats")
          .eq("user_id", userId)
          .maybeSingle();
        const stats = ((prof?.stats as Record<string, number>) ?? {});
        const newGold = Math.max(0, (stats.gold ?? 0) - item.gold_cost);
        await supabase
          .from("student_profiles")
          .update({ stats: { ...stats, gold: newGold } })
          .eq("user_id", userId);
      }

      // Update village state
      const { data: existing } = await supabase
        .from("player_village_state")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      const nextOwned = Array.from(new Set([...(existing?.owned_item_ids ?? []), item.id]));
      const nextTokens = Math.max(0, (existing?.tokens ?? 0) - item.token_cost);

      if (existing) {
        const { error } = await supabase
          .from("player_village_state")
          .update({ owned_item_ids: nextOwned, tokens: nextTokens })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("player_village_state")
          .insert({ user_id: userId, owned_item_ids: nextOwned, tokens: nextTokens });
        if (error) throw error;
      }

      await supabase.from("village_unlock_log").insert({
        user_id: userId,
        item_id: item.id,
        reason: "purchase",
      });

      return item;
    },
    onSuccess: (item) => {
      toast({ title: "Unlocked!", description: `${item.name} added to your village.` });
      qc.invalidateQueries({ queryKey: ["player-village-state", userId] });
    },
    onError: (e: Error) => {
      toast({ title: "Couldn't unlock", description: e.message, variant: "destructive" });
    },
  });
}

export function usePlaceVillageItem(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      slotId,
      itemId,
      currentPlaced,
    }: {
      slotId: string;
      itemId: string | null;
      currentPlaced: Record<string, string>;
    }) => {
      if (!userId) throw new Error("Not signed in");
      const next = { ...currentPlaced };
      if (itemId === null) delete next[slotId];
      else next[slotId] = itemId;
      const { error } = await supabase
        .from("player_village_state")
        .update({ placed_items: next })
        .eq("user_id", userId);
      if (error) throw error;
      return next;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["player-village-state", userId] });
    },
  });
}
