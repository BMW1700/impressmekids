import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, subWeeks, format } from "date-fns";

interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  sessionsCount: number;
  avgWcpm: number;
  avgAccuracy: number;
  avgFluency: number;
  totalWordsRead: number;
  avgClarity: number;
  avgConfidence: number;
  phonemeAccuracy: Record<string, number>;
}

interface ModeStats {
  mode: string;
  sessionsCount: number;
  avgWcpm: number;
  avgAccuracy: number;
  totalWordsRead: number;
  totalDurationMinutes: number;
}

interface PhonemeSubstitution {
  expected: string;
  actual: string;
  count: number;
  examples: string[];
}

interface WeeklyProgressData {
  currentWeek: WeeklyStats | null;
  previousWeek: WeeklyStats | null;
  weeklyTrend: WeeklyStats[];
  topStrengths: string[];
  areasForPractice: string[];
  phonemeSubstitutions: PhonemeSubstitution[];
  wcpmChange: number;
  accuracyChange: number;
  isImproving: boolean;
  // NEW: Mode breakdown
  modeBreakdown: ModeStats[];
  bestPerformingMode: string | null;
  totalReadingTimeMinutes: number;
}

export const useWeeklyProgress = (studentId: string | undefined, weeksToFetch = 4) => {
  return useQuery({
    queryKey: ["weekly-progress", studentId, weeksToFetch],
    queryFn: async (): Promise<WeeklyProgressData> => {
      if (!studentId) throw new Error("No student ID");

      const now = new Date();
      // Only fetch 4 weeks by default for faster load
      const oldestWeekStart = startOfWeek(subWeeks(now, weeksToFetch - 1), { weekStartsOn: 1 });
      const newestWeekEnd = endOfWeek(now, { weekStartsOn: 1 });

      // Fetch ALL data in parallel with single queries per table
      // NOTE: Session IDs for word_readings are now derived from the date-bounded sessions query
      const [sessionsResult, auraResult] = await Promise.all([
        supabase
          .from("reading_sessions")
          .select("id, wpm, accuracy_percent, fluency_score, words_read, phoneme_accuracy, created_at, duration_seconds, reading_mode")
          .eq("student_id", studentId)
          .gte("created_at", oldestWeekStart.toISOString())
          .lte("created_at", newestWeekEnd.toISOString())
          .limit(100), // Cap to prevent huge fetches
        supabase
          .from("aura_records")
          .select("clarity, confidence, wpm, created_at, duration_s")
          .eq("profile_id", studentId)
          .gte("created_at", oldestWeekStart.toISOString())
          .lte("created_at", newestWeekEnd.toISOString())
          .limit(100), // Cap to prevent huge fetches
      ]);

      const allSessions = sessionsResult.data || [];
      const allAuraRecords = auraResult.data || [];
      
      // Get session IDs from the ALREADY date-bounded sessions (not a separate unbounded query)
      // Cap at 30 sessions for word_readings to prevent huge IN clauses
      const sessionIds = allSessions.slice(0, 30).map((s) => s.id);

      // Fetch word readings for substitution analysis (only if we have sessions)
      const wordReadingsResult = sessionIds.length > 0
        ? await supabase
            .from("word_readings")
            .select("word_text, phonemes_expected, phonemes_detected, was_correct")
            .in("session_id", sessionIds)
            .eq("was_correct", false)
            .limit(100)
        : { data: [] };

      const wordReadings = wordReadingsResult.data || [];

      // Group data by week in JavaScript (instead of N database calls)
      const weeks: WeeklyStats[] = [];
      
      for (let i = 0; i < weeksToFetch; i++) {
        const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });

        // Filter sessions for this week
        const weekSessions = allSessions.filter(s => {
          const d = new Date(s.created_at);
          return d >= weekStart && d <= weekEnd;
        });

        // Filter AURA records for this week
        const weekAura = allAuraRecords.filter(a => {
          const d = new Date(a.created_at);
          return d >= weekStart && d <= weekEnd;
        });

        const sessionsCount = weekSessions.length + weekAura.length;

        if (sessionsCount === 0) {
          weeks.push({
            weekStart: format(weekStart, "yyyy-MM-dd"),
            weekEnd: format(weekEnd, "yyyy-MM-dd"),
            sessionsCount: 0,
            avgWcpm: 0,
            avgAccuracy: 0,
            avgFluency: 0,
            totalWordsRead: 0,
            avgClarity: 0,
            avgConfidence: 0,
            phonemeAccuracy: {},
          });
          continue;
        }

        // Calculate averages
        const avgWcpm = weekSessions.length
          ? weekSessions.reduce((sum, s) => sum + (s.wpm || 0), 0) / weekSessions.length
          : (weekAura.length ? weekAura.reduce((sum, a) => sum + (a.wpm || 0), 0) / weekAura.length : 0);

        const avgAccuracy = weekSessions.length
          ? weekSessions.reduce((sum, s) => sum + (s.accuracy_percent || 0), 0) / weekSessions.length
          : 0;

        const avgFluency = weekSessions.length
          ? weekSessions.reduce((sum, s) => sum + (s.fluency_score || 0), 0) / weekSessions.length
          : 0;

        const totalWordsRead = weekSessions.reduce((sum, s) => sum + (s.words_read || 0), 0);

        const avgClarity = weekAura.length
          ? weekAura.reduce((sum, a) => sum + (a.clarity || 0), 0) / weekAura.length
          : 0;

        const avgConfidence = weekAura.length
          ? weekAura.reduce((sum, a) => sum + (a.confidence || 0), 0) / weekAura.length
          : 0;

        // Aggregate phoneme accuracy
        const phonemeAccuracyAgg: Record<string, number[]> = {};
        weekSessions.forEach((s) => {
          if (s.phoneme_accuracy && typeof s.phoneme_accuracy === "object") {
            Object.entries(s.phoneme_accuracy as Record<string, number>).forEach(([phoneme, score]) => {
              if (!phonemeAccuracyAgg[phoneme]) phonemeAccuracyAgg[phoneme] = [];
              phonemeAccuracyAgg[phoneme].push(score);
            });
          }
        });

        const avgPhonemeAccuracy: Record<string, number> = {};
        Object.entries(phonemeAccuracyAgg).forEach(([phoneme, scores]) => {
          avgPhonemeAccuracy[phoneme] = scores.reduce((a, b) => a + b, 0) / scores.length;
        });

        weeks.push({
          weekStart: format(weekStart, "yyyy-MM-dd"),
          weekEnd: format(weekEnd, "yyyy-MM-dd"),
          sessionsCount,
          avgWcpm: Math.round(avgWcpm),
          avgAccuracy: Math.round(avgAccuracy),
          avgFluency: Math.round(avgFluency),
          totalWordsRead,
          avgClarity: Math.round(avgClarity),
          avgConfidence: Math.round(avgConfidence),
          phonemeAccuracy: avgPhonemeAccuracy,
        });
      }

      const currentWeek = weeks[0]?.sessionsCount > 0 ? weeks[0] : null;
      const previousWeek = weeks[1]?.sessionsCount > 0 ? weeks[1] : null;

      // Calculate changes
      const wcpmChange = currentWeek && previousWeek
        ? currentWeek.avgWcpm - previousWeek.avgWcpm
        : 0;

      const accuracyChange = currentWeek && previousWeek
        ? currentWeek.avgAccuracy - previousWeek.avgAccuracy
        : 0;

      // Identify strengths and areas for practice
      const allPhonemes: Record<string, number[]> = {};
      weeks.forEach((week) => {
        Object.entries(week.phonemeAccuracy).forEach(([phoneme, score]) => {
          if (!allPhonemes[phoneme]) allPhonemes[phoneme] = [];
          allPhonemes[phoneme].push(score);
        });
      });

      const phonemeAverages = Object.entries(allPhonemes).map(([phoneme, scores]) => ({
        phoneme,
        avg: scores.reduce((a, b) => a + b, 0) / scores.length,
      }));

      const topStrengths = phonemeAverages
        .filter((p) => p.avg >= 80)
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 5)
        .map((p) => p.phoneme);

      const areasForPractice = phonemeAverages
        .filter((p) => p.avg < 70)
        .sort((a, b) => a.avg - b.avg)
        .slice(0, 5)
        .map((p) => p.phoneme);

      // Process substitution patterns
      const substitutionMap: Record<string, { count: number; examples: string[] }> = {};
      wordReadings.forEach((wr) => {
        const expected = wr.phonemes_expected as string[] | null;
        const detected = wr.phonemes_detected as string[] | null;

        if (expected && detected && Array.isArray(expected) && Array.isArray(detected)) {
          const minLen = Math.min(expected.length, detected.length);
          for (let i = 0; i < minLen; i++) {
            if (expected[i] !== detected[i]) {
              const key = `${expected[i]}→${detected[i]}`;
              if (!substitutionMap[key]) {
                substitutionMap[key] = { count: 0, examples: [] };
              }
              substitutionMap[key].count++;
              if (substitutionMap[key].examples.length < 3 && wr.word_text) {
                if (!substitutionMap[key].examples.includes(wr.word_text)) {
                  substitutionMap[key].examples.push(wr.word_text);
                }
              }
            }
          }
        }
      });

      const phonemeSubstitutions: PhonemeSubstitution[] = Object.entries(substitutionMap)
        .map(([key, value]) => {
          const [expected, actual] = key.split("→");
          return { expected, actual, count: value.count, examples: value.examples };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate mode breakdown for current week
      const modeMap: Record<string, { sessions: typeof allSessions; totalDuration: number }> = {};
      allSessions.forEach((s) => {
        const mode = (s as any).reading_mode || 'word_by_word';
        if (!modeMap[mode]) {
          modeMap[mode] = { sessions: [], totalDuration: 0 };
        }
        modeMap[mode].sessions.push(s);
        modeMap[mode].totalDuration += (s.duration_seconds as number) || 0;
      });

      // Add aura_records as speaking practice mode
      if (allAuraRecords.length > 0) {
        const totalAuraDuration = allAuraRecords.reduce((sum, a) => sum + ((a as any).duration_s || 0), 0);
        modeMap['speaking_practice'] = {
          sessions: allAuraRecords as any,
          totalDuration: totalAuraDuration,
        };
      }

      const modeBreakdown: ModeStats[] = Object.entries(modeMap).map(([mode, data]) => {
        const sessions = data.sessions;
        return {
          mode,
          sessionsCount: sessions.length,
          avgWcpm: sessions.length
            ? Math.round(sessions.reduce((sum, s) => sum + ((s as any).wpm || 0), 0) / sessions.length)
            : 0,
          avgAccuracy: sessions.length
            ? Math.round(sessions.reduce((sum, s) => sum + ((s as any).accuracy_percent || 0), 0) / sessions.length)
            : 0,
          totalWordsRead: sessions.reduce((sum, s) => sum + ((s as any).words_read || 0), 0),
          totalDurationMinutes: Math.round(data.totalDuration / 60),
        };
      }).sort((a, b) => b.totalWordsRead - a.totalWordsRead);

      // Find best performing mode (highest accuracy with at least 2 sessions)
      const qualifiedModes = modeBreakdown.filter(m => m.sessionsCount >= 2);
      const bestPerformingMode = qualifiedModes.length > 0
        ? qualifiedModes.sort((a, b) => b.avgAccuracy - a.avgAccuracy)[0].mode
        : null;

      // Total reading time across all modes
      const totalReadingTimeMinutes = modeBreakdown.reduce((sum, m) => sum + m.totalDurationMinutes, 0);

      return {
        currentWeek,
        previousWeek,
        weeklyTrend: weeks.filter((w) => w.sessionsCount > 0).reverse(),
        topStrengths,
        areasForPractice,
        phonemeSubstitutions,
        wcpmChange,
        accuracyChange,
        isImproving: wcpmChange > 0 || accuracyChange > 0,
        modeBreakdown,
        bestPerformingMode,
        totalReadingTimeMinutes,
      };
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minute cache
  });
};
