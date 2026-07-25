import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EquippedStats {
  hp: number;
  attack: number;
  mp_regen: number;
}

const EMPTY: EquippedStats = { hp: 0, attack: 0, mp_regen: 0 };

/**
 * Reads the current player's equipped loot and returns summed stat bonuses.
 * Call once at the top of a combat scene; the bonuses feed into HP + damage.
 */
export function useEquippedStats() {
  const [stats, setStats] = useState<EquippedStats>(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user.id;
    if (!uid) {
      setStats(EMPTY);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("player_loot")
      .select("stats")
      .eq("user_id", uid)
      .eq("equipped", true);
    if (error) {
      console.error("[useEquippedStats] fetch failed:", error);
      setStats(EMPTY);
    } else {
      const total: EquippedStats = { hp: 0, attack: 0, mp_regen: 0 };
      for (const row of data ?? []) {
        const s = (row.stats as EquippedStats | null) ?? EMPTY;
        total.hp += s.hp ?? 0;
        total.attack += s.attack ?? 0;
        total.mp_regen += s.mp_regen ?? 0;
      }
      setStats(total);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { stats, loading, refresh: load };
}
