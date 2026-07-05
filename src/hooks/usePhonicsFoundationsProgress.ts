import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'yubilearn:phonics-foundations:mastered';

interface MasteryRecord {
  stage_id: string;
  words_correct: number;
  words_attempted: number;
  accuracy_percent: number;
  mastered_at: string;
}

const loadLocalMastered = (): Set<string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
};

const persistLocal = (set: Set<string>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
};

/**
 * Hook: World 0 mastery state with DB persistence + localStorage fallback.
 * - Anonymous users → localStorage only.
 * - Signed-in students → DB write + localStorage mirror for instant UI.
 */
export const usePhonicsFoundationsProgress = () => {
  const [mastered, setMastered] = useState<Set<string>>(() => loadLocalMastered());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load auth + DB state on mount
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? null;
      if (cancelled) return;
      setUserId(uid);

      if (uid) {
        const { data, error } = await supabase
          .from('phonics_foundations_progress')
          .select('stage_id')
          .eq('student_id', uid);

        if (!cancelled && !error && data) {
          const dbSet = new Set(data.map((r) => r.stage_id));
          // Merge DB + local (DB wins for canonical state)
          setMastered(dbSet);
          persistLocal(dbSet);
        }
      }
      if (!cancelled) setLoading(false);
    };

    init();
    return () => { cancelled = true; };
  }, []);

  const recordMastery = useCallback(
    async (stageId: string, wordsCorrect: number, wordsAttempted: number) => {
      const accuracy = wordsAttempted > 0
        ? Math.round((wordsCorrect / wordsAttempted) * 1000) / 10
        : 0;

      // Optimistic local update
      setMastered((prev) => {
        const next = new Set(prev);
        next.add(stageId);
        persistLocal(next);
        return next;
      });

      // DB persistence (skip if anonymous)
      if (!userId) return { persisted: false };

      const { error } = await supabase
        .from('phonics_foundations_progress')
        .upsert(
          {
            student_id: userId,
            stage_id: stageId,
            words_correct: wordsCorrect,
            words_attempted: wordsAttempted,
            accuracy_percent: accuracy,
            mastered_at: new Date().toISOString(),
          },
          { onConflict: 'student_id,stage_id' },
        );

      return { persisted: !error, error: error?.message };
    },
    [userId],
  );

  return { mastered, loading, recordMastery, isAuthenticated: !!userId };
};

export type { MasteryRecord };
