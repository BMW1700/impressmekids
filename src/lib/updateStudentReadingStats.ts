import { supabase } from "@/integrations/supabase/client";
import type { GradeMode } from "@/lib/gameTheme";

interface PendingReadingStat {
  studentId: string;
  wordsRead: number;
  xpEarned: number;
  gradeMode: GradeMode;
  timestamp: number;
}

const PENDING_KEY = "pending_reading_stats";

/**
 * Flush any cached stats that failed to save while offline.
 * Called on module load and whenever the browser comes back online.
 */
const flushPendingStats = async () => {
  const raw = localStorage.getItem(PENDING_KEY);
  if (!raw) return;

  let pending: PendingReadingStat[];
  try {
    pending = JSON.parse(raw);
  } catch {
    localStorage.removeItem(PENDING_KEY);
    return;
  }
  if (!pending.length) {
    localStorage.removeItem(PENDING_KEY);
    return;
  }

  const stillPending: PendingReadingStat[] = [];

  for (const entry of pending) {
    try {
      const { error } = await supabase.rpc("upsert_reading_stats", {
        p_student_id: entry.studentId,
        p_words_read: entry.wordsRead,
        p_xp_earned: entry.xpEarned,
        p_grade_mode: entry.gradeMode || 'k5',
      });
      if (error) throw error;
      console.log("[ReadingStats] ✅ Flushed pending stat for", entry.studentId);
    } catch {
      stillPending.push(entry);
    }
  }

  if (stillPending.length) {
    localStorage.setItem(PENDING_KEY, JSON.stringify(stillPending));
  } else {
    localStorage.removeItem(PENDING_KEY);
  }
};

// Auto-flush on load and when coming back online
if (typeof window !== "undefined") {
  flushPendingStats();
  window.addEventListener("online", flushPendingStats);
}

/**
 * Shared utility to upsert student_reading_stats after any reading session.
 * Uses an atomic database RPC — no read-then-write race conditions.
 * On network failure, caches to localStorage for automatic retry.
 *
 * Used by GuidedReadingFlow (SingleWordReader + full-passage) and BattleReader.
 */
export const updateStudentReadingStats = async (
  studentId: string,
  sessionData: {
    wordsRead: number;
    xpEarned: number;
    gradeMode?: GradeMode;
  }
) => {
  if (!studentId || sessionData.wordsRead === 0) return;

  const gradeMode = sessionData.gradeMode || 'k5';

  try {
    const { error } = await supabase.rpc("upsert_reading_stats", {
      p_student_id: studentId,
      p_words_read: sessionData.wordsRead,
      p_xp_earned: sessionData.xpEarned,
      p_grade_mode: gradeMode,
    });

    if (error) throw error;
    console.log("[ReadingStats] ✅ Stats synced for", studentId, "mode:", gradeMode);
  } catch (err) {
    console.error("[ReadingStats] Failed, caching for retry:", err);

    try {
      const raw = localStorage.getItem(PENDING_KEY);
      const pending: PendingReadingStat[] = raw ? JSON.parse(raw) : [];
      pending.push({
        studentId,
        wordsRead: sessionData.wordsRead,
        xpEarned: sessionData.xpEarned,
        gradeMode,
        timestamp: Date.now(),
      });
      localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
    } catch {
      // localStorage full or unavailable — silent fail
    }
  }
};
