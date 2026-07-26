import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getActiveSeasonId } from '@/lib/rpgSeasonPass';

export interface DailyQuest {
  id: string;
  quest_type: string;
  target_count: number;
  current_count: number;
  xp_reward: number;
  completed_at: string | null;
}

export function useDailyQuests() {
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    // Idempotent: creates today's 3 quests if missing and returns them.
    const { data, error } = await supabase.rpc('rpg_ensure_daily_quests');
    if (error) {
      console.error('rpg_ensure_daily_quests failed:', error);
      setQuests([]);
    } else {
      setQuests((data ?? []) as DailyQuest[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  return { quests, loading, refresh: load };
}

/**
 * Bump a daily quest by `delta`. Server marks complete and awards Season XP atomically.
 * Fire-and-forget from combat callbacks; failures are logged but non-fatal.
 */
export async function awardQuestProgress(questType: string, delta = 1): Promise<void> {
  const { error } = await supabase.rpc('rpg_award_quest_progress', {
    p_quest_type: questType,
    p_delta: delta,
    p_season_id: getActiveSeasonId(),
  });
  if (error) console.error('rpg_award_quest_progress failed:', error);
}
