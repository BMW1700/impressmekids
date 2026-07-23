import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { LootItem, LootRarity, LootSlot } from "@/lib/rpgLootCatalog";

interface LootRow {
  id: string;
  item_id: string;
  rarity: LootRarity;
  slot: LootSlot;
  stats: { hp?: number; attack?: number; mp_regen?: number } | null;
  equipped: boolean;
  dropped_from_boss: string | null;
  world_number: number | null;
}

function rowToItem(row: LootRow): LootItem {
  return {
    id: row.id,
    item_id: row.item_id,
    name: row.item_id,
    rarity: row.rarity,
    slot: row.slot,
    stats: row.stats ?? {},
    equipped: row.equipped,
    world_number: row.world_number,
    emoji: "🎁",
    flavor: "",
  };
}

/** Fetch + mutate a player's loot inventory. */
export function usePlayerLoot() {
  const [items, setItems] = useState<LootItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user.id;
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data, error: err } = await supabase
      .from("player_loot")
      .select("id,item_id,rarity,slot,stats,equipped,dropped_from_boss,world_number")
      .eq("user_id", uid)
      .order("acquired_at", { ascending: false });
    if (err) {
      setError(err.message);
      setItems([]);
    } else {
      setItems((data as unknown as LootRow[]).map(rowToItem));
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setEquipped = useCallback(
    async (lootId: string, equipped: boolean) => {
      // Optimistic — but enforce one-item-per-slot when equipping
      let unequipIds: string[] = [];
      setItems((prev) => {
        const target = prev.find((i) => i.id === lootId);
        if (!target) return prev;
        if (equipped) {
          unequipIds = prev.filter((i) => i.slot === target.slot && i.equipped && i.id !== lootId).map((i) => i.id);
        }
        return prev.map((i) => {
          if (i.id === lootId) return { ...i, equipped };
          if (equipped && unequipIds.includes(i.id)) return { ...i, equipped: false };
          return i;
        });
      });

      if (unequipIds.length > 0) {
        await supabase.from("player_loot").update({ equipped: false }).in("id", unequipIds);
      }
      const { error: err } = await supabase.from("player_loot").update({ equipped }).eq("id", lootId);
      if (err) {
        setError(err.message);
        void refresh();
      }
    },
    [refresh],
  );

  return { items, loading, error, refresh, setEquipped };
}

export interface RolledLoot {
  loot_id: string;
  item_id: string;
  rarity: LootRarity;
  slot: LootSlot;
  stats: { hp?: number; attack?: number; mp_regen?: number };
}

/** Trigger a server-side boss loot roll. Returns the new drop, or null if unauthenticated. */
export async function rollBossLoot(bossId: string, worldNumber: number): Promise<RolledLoot | null> {
  const { data, error } = await supabase.rpc("roll_boss_loot", {
    _boss_id: bossId,
    _world_number: worldNumber,
  });
  if (error) {
    console.error("roll_boss_loot failed:", error);
    return null;
  }
  const first = Array.isArray(data) ? data[0] : data;
  if (!first) return null;
  return first as RolledLoot;
}
