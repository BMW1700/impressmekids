import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HighlightCard {
  id: string;
  enemy_id: string;
  enemy_name: string | null;
  world_number: number | null;
  damage_dealt: number;
  turns_taken: number;
  perfect_blocks: number;
  stats: Record<string, unknown>;
  shareable_slug: string;
  created_at: string;
}

export interface GenerateHighlightInput {
  enemyId: string;
  enemyName?: string | null;
  worldNumber?: number | null;
  damageDealt: number;
  turnsTaken: number;
  perfectBlocks: number;
  stats?: Record<string, unknown>;
}

export async function generateHighlight(input: GenerateHighlightInput): Promise<{ id: string; slug: string } | null> {
  const { data, error } = await supabase.rpc('rpg_generate_highlight', {
    _enemy_id: input.enemyId,
    _enemy_name: input.enemyName ?? null,
    _world_number: input.worldNumber ?? null,
    _damage_dealt: Math.floor(input.damageDealt),
    _turns_taken: Math.floor(input.turnsTaken),
    _perfect_blocks: Math.floor(input.perfectBlocks),
    _stats: input.stats ?? {},
  });
  if (error) { console.error('rpg_generate_highlight failed:', error); return null; }
  const row = Array.isArray(data) ? data[0] : data;
  return row ? { id: row.id, slug: row.shareable_slug } : null;
}

export function useMyHighlights(limit = 20) {
  const [cards, setCards] = useState<HighlightCard[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user.id;
    if (!uid) { setCards([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from('rpg_highlight_cards')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) console.error('useMyHighlights:', error);
    setCards(((data ?? []) as unknown) as HighlightCard[]);
    setLoading(false);
  }, [limit]);

  useEffect(() => { void load(); }, [load]);
  return { cards, loading, refresh: load };
}
