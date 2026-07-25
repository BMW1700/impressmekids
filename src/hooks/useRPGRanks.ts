import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CURRENT_SEASON } from '@/lib/rpgSeasonPass';
import { tierFromPoints, type RankTier } from '@/lib/rpgRanks';

export interface RankRow {
  user_id: string;
  rank_points: number;
  tier: RankTier;
  wins: number;
  losses: number;
  active_title?: string | null;
  active_badge?: string | null;
}

export interface LeaderboardEntry extends RankRow {
  display_name: string;
  position: number;
}

/**
 * Award rank points to the current user for the current season.
 * Fire-and-forget from PvP end handlers.
 */
export async function awardRankPoints(delta: number, isWin: boolean): Promise<RankRow | null> {
  const { data, error } = await supabase.rpc('rpg_award_rank_points', {
    _season_id: CURRENT_SEASON.id,
    _delta: delta,
    _win: isWin,
  });
  if (error) {
    console.error('rpg_award_rank_points failed:', error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return row ? { user_id: '', rank_points: row.rank_points, tier: row.tier as RankTier, wins: row.wins, losses: row.losses } : null;
}

export function useMyRank() {
  const [rank, setRank] = useState<RankRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user.id;
    if (!uid) { setRank(null); setLoading(false); return; }
    const { data, error } = await supabase
      .from('rpg_player_ranks')
      .select('user_id, rank_points, tier, wins, losses')
      .eq('user_id', uid)
      .eq('season_id', CURRENT_SEASON.id)
      .maybeSingle();
    if (error) console.error('useMyRank:', error);
    if (data) {
      setRank({ ...data, tier: (data.tier as RankTier) });
    } else {
      setRank({ user_id: uid, rank_points: 0, tier: 'bronze', wins: 0, losses: 0 });
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  return { rank, loading, refresh: load };
}

export function useLeaderboard(limit = 100) {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    // Top N by points this season.
    const { data: ranks, error } = await supabase
      .from('rpg_player_ranks')
      .select('user_id, rank_points, tier, wins, losses')
      .eq('season_id', CURRENT_SEASON.id)
      .order('rank_points', { ascending: false })
      .limit(limit);
    if (error) { console.error('leaderboard:', error); setRows([]); setLoading(false); return; }

    // Best-effort name lookup from public_profiles.
    const ids = (ranks ?? []).map((r) => r.user_id);
    let names: Record<string, string> = {};
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from('public_profiles')
        .select('id, display_name')
        .in('id', ids);
      names = Object.fromEntries((profs ?? []).map((p: { id: string; display_name: string | null }) => [p.id, p.display_name ?? 'Champion']));
    }

    setRows((ranks ?? []).map((r, i) => ({
      ...r,
      tier: (r.tier as RankTier) ?? tierFromPoints(r.rank_points).tier,
      display_name: names[r.user_id] ?? 'Champion',
      position: i + 1,
    })));
    setLoading(false);
  }, [limit]);

  useEffect(() => { void load(); }, [load]);
  return { rows, loading, refresh: load };
}
