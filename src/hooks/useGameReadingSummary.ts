import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GameReadingSummary {
  avgWpm: number;
  avgWcpm: number;
  avgAccuracy: number;
  fluencyLabel: "Independent" | "Instructional" | "Frustration" | "—";
  fluencyTone: "good" | "warn" | "bad" | "neutral";
  sessionCount: number;
  totalSessions: number;
  totalWordsRead: number;
  hasEnoughData: boolean;
}

function fluencyFromAccuracy(acc: number): Pick<GameReadingSummary, "fluencyLabel" | "fluencyTone"> {
  if (!acc) return { fluencyLabel: "—", fluencyTone: "neutral" };
  if (acc >= 97) return { fluencyLabel: "Independent", fluencyTone: "good" };
  if (acc >= 90) return { fluencyLabel: "Instructional", fluencyTone: "warn" };
  return { fluencyLabel: "Frustration", fluencyTone: "bad" };
}

/**
 * Aggregates the last 20 reading sessions to produce headline fluency stats
 * (WPM, WCPM, accuracy, fluency level) for Game Mode dashboard + analytics.
 */
export function useGameReadingSummary(studentId?: string) {
  return useQuery({
    queryKey: ["game-reading-summary", studentId],
    enabled: !!studentId,
    staleTime: 60_000,
    queryFn: async (): Promise<GameReadingSummary> => {
      const [recentRes, countRes, statsRes] = await Promise.all([
        supabase
          .from("reading_sessions")
          .select("wpm, wcpm, accuracy_percent")
          .eq("student_id", studentId!)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("reading_sessions")
          .select("id", { count: "exact", head: true })
          .eq("student_id", studentId!),
        supabase
          .from("student_reading_stats")
          .select("total_words_read")
          .eq("student_id", studentId!)
          .maybeSingle(),
      ]);

      if (recentRes.error) console.error("[useGameReadingSummary] reading_sessions error", recentRes.error);
      if (countRes.error) console.error("[useGameReadingSummary] reading_sessions count error", countRes.error);
      if (statsRes.error) console.error("[useGameReadingSummary] student_reading_stats error", statsRes.error);

      const list = recentRes.data ?? [];
      const n = list.length;
      const totalSessions = countRes.count ?? 0;
      const totalWordsRead = (statsRes.data?.total_words_read as number | undefined) ?? 0;

      if (!n) {
        return {
          avgWpm: 0,
          avgWcpm: 0,
          avgAccuracy: 0,
          fluencyLabel: "—",
          fluencyTone: "neutral",
          sessionCount: 0,
          totalSessions,
          totalWordsRead,
          hasEnoughData: false,
        };
      }

      const avgWpm = Math.round(list.reduce((s, r) => s + (r.wpm || 0), 0) / n);
      const avgWcpm = Math.round(list.reduce((s, r) => s + (r.wcpm || r.wpm || 0), 0) / n);
      const avgAccuracy = Math.round(list.reduce((s, r) => s + (r.accuracy_percent || 0), 0) / n);

      return {
        avgWpm,
        avgWcpm,
        avgAccuracy,
        ...fluencyFromAccuracy(avgAccuracy),
        sessionCount: n,
        totalSessions,
        totalWordsRead,
        hasEnoughData: n >= 3,
      };
    },
  });
}

