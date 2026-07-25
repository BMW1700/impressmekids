import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CURRENT_SEASON } from '@/lib/rpgSeasonPass';

export interface SeasonPassState {
  xp_total: number;
  claimed_tiers: number[];
}

export function useSeasonPass() {
  const [state, setState] = useState<SeasonPassState>({ xp_total: 0, claimed_tiers: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('rpg_season_pass')
      .select('xp_total, claimed_tiers')
      .eq('user_id', uid)
      .eq('season_id', CURRENT_SEASON.id)
      .maybeSingle();
    if (error) console.error('rpg_season_pass fetch failed:', error);
    setState({
      xp_total: data?.xp_total ?? 0,
      claimed_tiers: (data?.claimed_tiers as number[] | null) ?? [],
    });
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const claimTier = useCallback(async (tier: number, requiredXp: number): Promise<boolean> => {
    const { data, error } = await supabase.rpc('rpg_claim_season_tier', {
      p_season_id: CURRENT_SEASON.id,
      p_tier: tier,
      p_required_xp: requiredXp,
    });
    if (error) { console.error('rpg_claim_season_tier failed:', error); return false; }
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.success) {
      // Equip visible cosmetic reward (title/badge) after claim
      const t = CURRENT_SEASON.tiers.find((x) => x.tier === tier);
      if (t && (t.rewardKind === 'title' || t.rewardKind === 'badge')) {
        await supabase.rpc('rpg_set_active_cosmetic', {
          _season_id: CURRENT_SEASON.id,
          _kind: t.rewardKind,
          _reward_id: t.rewardId,
          _label: `${t.rewardEmoji} ${t.rewardLabel}`,
        });
      }
      setState((prev) => ({ ...prev, claimed_tiers: (row.claimed_tiers as number[]) ?? prev.claimed_tiers }));
      return true;
    }
    return false;
  }, []);

  return { ...state, loading, refresh: load, claimTier };
}
