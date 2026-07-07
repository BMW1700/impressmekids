import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GradeMode } from "@/lib/gameTheme";

export interface PreKLevelCompletion {
  world_number: number;
  level_number: number;
  best_stars: number;
  best_score: number;
  words_read: number;
  correct_words: number;
}

/**
 * Reads every Pre-K per-level completion for the signed-in child. Keyed by
 * `${world_number}:${level_number}` for cheap lookup by the world map + level
 * select screens.
 */
export function usePreKLevelStars(userId?: string, gradeMode: GradeMode = "k5") {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["prek-level-completions", userId, gradeMode],
    queryFn: async (): Promise<PreKLevelCompletion[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("prek_level_completions" as any)
        .select("world_number, level_number, best_stars, best_score, words_read, correct_words")
        .eq("user_id", userId)
        .eq("grade_mode", gradeMode);
      if (error) {
        console.error("[usePreKLevelStars] load failed", error);
        return [];
      }
      return (data as unknown as PreKLevelCompletion[]) || [];
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  const byKey = new Map<string, PreKLevelCompletion>();
  for (const row of query.data || []) {
    byKey.set(`${row.world_number}:${row.level_number}`, row);
  }

  const starsFor = (worldNumber: number, levelNumber: number): number =>
    byKey.get(`${worldNumber}:${levelNumber}`)?.best_stars ?? 0;

  const isCompleted = (worldNumber: number, levelNumber: number): boolean =>
    (byKey.get(`${worldNumber}:${levelNumber}`)?.best_stars ?? 0) > 0;

  const worldTotals = (worldNumber: number) => {
    let levelsCompleted = 0;
    let starsEarned = 0;
    for (const row of query.data || []) {
      if (row.world_number !== worldNumber) continue;
      if (row.best_stars > 0) {
        levelsCompleted += 1;
        starsEarned += row.best_stars;
      }
    }
    return { levelsCompleted, starsEarned };
  };

  const upsert = useMutation({
    mutationFn: async (row: {
      worldNumber: number;
      levelNumber: number;
      stars: number;
      wordsRead: number;
      correctWords: number;
    }) => {
      if (!userId) return;
      const existing = byKey.get(`${row.worldNumber}:${row.levelNumber}`);
      const bestStars = Math.max(row.stars, existing?.best_stars ?? 0);
      const bestScore = Math.max(row.correctWords, existing?.best_score ?? 0);
      const payload = {
        user_id: userId,
        grade_mode: gradeMode,
        world_number: row.worldNumber,
        level_number: row.levelNumber,
        best_stars: bestStars,
        best_score: bestScore,
        words_read: Math.max(row.wordsRead, existing?.words_read ?? 0),
        correct_words: Math.max(row.correctWords, existing?.correct_words ?? 0),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("prek_level_completions" as any)
        .upsert(payload as any, {
          onConflict: "user_id,grade_mode,world_number,level_number",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prek-level-completions", userId, gradeMode] });
    },
  });

  return {
    completions: query.data || [],
    byKey,
    starsFor,
    isCompleted,
    worldTotals,
    upsertCompletion: upsert.mutateAsync,
    isLoading: query.isLoading,
  };
}

/** Standalone writer for code paths that don't have the hook mounted. */
export async function recordPreKLevelCompletion(opts: {
  userId: string;
  gradeMode: GradeMode;
  worldNumber: number;
  levelNumber: number;
  stars: number;
  wordsRead: number;
  correctWords: number;
}): Promise<void> {
  try {
    // Read existing to keep monotonic max.
    const { data: existing } = await supabase
      .from("prek_level_completions" as any)
      .select("best_stars, best_score, words_read, correct_words")
      .eq("user_id", opts.userId)
      .eq("grade_mode", opts.gradeMode)
      .eq("world_number", opts.worldNumber)
      .eq("level_number", opts.levelNumber)
      .maybeSingle();
    const prev = (existing as any) || {};
    const payload = {
      user_id: opts.userId,
      grade_mode: opts.gradeMode,
      world_number: opts.worldNumber,
      level_number: opts.levelNumber,
      best_stars: Math.max(opts.stars, prev.best_stars ?? 0),
      best_score: Math.max(opts.correctWords, prev.best_score ?? 0),
      words_read: Math.max(opts.wordsRead, prev.words_read ?? 0),
      correct_words: Math.max(opts.correctWords, prev.correct_words ?? 0),
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("prek_level_completions" as any)
      .upsert(payload as any, {
        onConflict: "user_id,grade_mode,world_number,level_number",
      });
    if (error) console.error("[recordPreKLevelCompletion] upsert failed", error);
  } catch (err) {
    console.error("[recordPreKLevelCompletion] threw", err);
  }
}
