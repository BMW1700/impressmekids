import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CURRENT_SEASON, type Season, type SeasonTier } from '@/lib/rpgSeasonPass';

export interface SeasonRow {
  id: string;
  name: string;
  theme_color: string;
  starts_at: string;
  ends_at: string;
  tiers: SeasonTier[];
  is_active: boolean;
}

export function rowToSeason(row: SeasonRow): Season {
  return {
    id: row.id,
    name: row.name,
    themeColor: row.theme_color,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    tiers: Array.isArray(row.tiers) ? row.tiers : [],
  };
}

/**
 * Reads the active season from the database so a new season can be launched
 * without a code deploy. Falls back to the bundled CURRENT_SEASON constant if
 * the table is unreachable or empty, so the Season Pass never renders blank.
 */
export function useActiveSeason() {
  const [season, setSeason] = useState<Season>(CURRENT_SEASON);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rpg_seasons')
      .select('id, name, theme_color, starts_at, ends_at, tiers, is_active')
      .eq('is_active', true)
      .maybeSingle();
    if (error) console.error('useActiveSeason:', error);
    if (data && Array.isArray(data.tiers) && data.tiers.length > 0) {
      setSeason(rowToSeason(data as unknown as SeasonRow));
    } else {
      setSeason(CURRENT_SEASON);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  return { season, loading, refresh: load };
}

/** All seasons, newest first. Used by the super-admin manager. */
export function useAllSeasons() {
  const [seasons, setSeasons] = useState<SeasonRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rpg_seasons')
      .select('id, name, theme_color, starts_at, ends_at, tiers, is_active')
      .order('starts_at', { ascending: false });
    if (error) console.error('useAllSeasons:', error);
    setSeasons(((data ?? []) as unknown as SeasonRow[]));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  return { seasons, loading, refresh: load };
}
