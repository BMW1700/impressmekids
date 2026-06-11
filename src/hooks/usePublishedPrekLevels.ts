import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PublishedPrekLevelMeta {
  title: string;
  goal: string;
  wordCount: number;
}

/**
 * Returns the set of published Pre-K level_numbers (and per-level meta) for a
 * given Pre-K world_number, as authored in the Super Admin CMS. Non-published
 * or missing levels should NOT be shown in the player's level select.
 */
export function usePublishedPrekLevels(worldNumber: number | null | undefined) {
  const [levelNums, setLevelNums] = useState<Set<number>>(new Set());
  const [meta, setMeta] = useState<Record<number, PublishedPrekLevelMeta>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!worldNumber) {
      setLevelNums(new Set());
      setMeta({});
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const { data: world } = await supabase
        .from("prek_worlds")
        .select("id, is_published")
        .eq("world_number", worldNumber)
        .maybeSingle();
      if (cancelled) return;
      if (!world || !world.is_published) {
        setLevelNums(new Set());
        setMeta({});
        setLoading(false);
        return;
      }
      const { data: levels } = await supabase
        .from("prek_levels")
        .select("level_number, title, goal, id, is_published")
        .eq("world_id", world.id)
        .eq("is_published", true);
      if (cancelled) return;
      const nums = new Set<number>();
      const m: Record<number, PublishedPrekLevelMeta> = {};
      const ids: string[] = [];
      for (const l of levels ?? []) {
        nums.add(l.level_number);
        m[l.level_number] = { title: l.title, goal: l.goal ?? "", wordCount: 0 };
        ids.push(l.id);
      }
      if (ids.length) {
        const { data: words } = await supabase
          .from("prek_level_words")
          .select("level_id");
        const counts: Record<string, number> = {};
        for (const w of words ?? []) counts[w.level_id] = (counts[w.level_id] ?? 0) + 1;
        for (const l of levels ?? []) {
          if (m[l.level_number]) m[l.level_number].wordCount = counts[l.id] ?? 0;
        }
      }
      setLevelNums(nums);
      setMeta(m);
      setLoading(false);
    })().catch(() => {
      if (!cancelled) {
        setLevelNums(new Set());
        setMeta({});
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [worldNumber]);

  return { levelNums, meta, loading };
}
