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
}

export const useWeeklyProgress = (studentId: string | undefined, weeksToFetch = 8) => {
  return useQuery({
    queryKey: ["weekly-progress", studentId, weeksToFetch],
    queryFn: async (): Promise<WeeklyProgressData> => {
      if (!studentId) throw new Error("No student ID");

      const now = new Date();
      const weeks: WeeklyStats[] = [];

      // Fetch data for each week
      for (let i = 0; i < weeksToFetch; i++) {
        const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });

        // Fetch reading sessions for this week
        const { data: sessions } = await supabase
          .from("reading_sessions")
          .select("wpm, accuracy_percent, fluency_score, words_read, phoneme_accuracy")
          .eq("student_id", studentId)
          .gte("created_at", weekStart.toISOString())
          .lte("created_at", weekEnd.toISOString());

        // Fetch AURA records for this week
        const { data: auraRecords } = await supabase
          .from("aura_records")
          .select("clarity, confidence, wpm")
          .eq("profile_id", studentId)
          .gte("created_at", weekStart.toISOString())
          .lte("created_at", weekEnd.toISOString());

        const sessionsCount = (sessions?.length || 0) + (auraRecords?.length || 0);
        
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

        // Calculate reading session averages
        const avgWcpm = sessions?.length 
          ? sessions.reduce((sum, s) => sum + (s.wpm || 0), 0) / sessions.length 
          : (auraRecords?.length ? auraRecords.reduce((sum, a) => sum + (a.wpm || 0), 0) / auraRecords.length : 0);
        
        const avgAccuracy = sessions?.length 
          ? sessions.reduce((sum, s) => sum + (s.accuracy_percent || 0), 0) / sessions.length 
          : 0;
        
        const avgFluency = sessions?.length 
          ? sessions.reduce((sum, s) => sum + (s.fluency_score || 0), 0) / sessions.length 
          : 0;
        
        const totalWordsRead = sessions?.reduce((sum, s) => sum + (s.words_read || 0), 0) || 0;

        // Calculate AURA averages
        const avgClarity = auraRecords?.length 
          ? auraRecords.reduce((sum, a) => sum + (a.clarity || 0), 0) / auraRecords.length 
          : 0;
        
        const avgConfidence = auraRecords?.length 
          ? auraRecords.reduce((sum, a) => sum + (a.confidence || 0), 0) / auraRecords.length 
          : 0;

        // Aggregate phoneme accuracy
        const phonemeAccuracy: Record<string, number[]> = {};
        sessions?.forEach((s) => {
          if (s.phoneme_accuracy && typeof s.phoneme_accuracy === "object") {
            Object.entries(s.phoneme_accuracy as Record<string, number>).forEach(([phoneme, score]) => {
              if (!phonemeAccuracy[phoneme]) phonemeAccuracy[phoneme] = [];
              phonemeAccuracy[phoneme].push(score);
            });
          }
        });

        const avgPhonemeAccuracy: Record<string, number> = {};
        Object.entries(phonemeAccuracy).forEach(([phoneme, scores]) => {
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

      // Identify strengths and areas for practice from phoneme data
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

      // Get phoneme substitution patterns from word_readings
      const { data: wordReadings } = await supabase
        .from("word_readings")
        .select("word_text, phonemes_expected, phonemes_detected, was_correct, mispronunciation_type")
        .eq("was_correct", false)
        .order("created_at", { ascending: false })
        .limit(100);

      const substitutionMap: Record<string, { count: number; examples: string[] }> = {};
      wordReadings?.forEach((wr) => {
        // Compare expected vs detected phonemes
        const expected = wr.phonemes_expected as string[] | null;
        const detected = wr.phonemes_detected as string[] | null;
        
        if (expected && detected && Array.isArray(expected) && Array.isArray(detected)) {
          // Find mismatches between expected and detected phonemes
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
      };
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });
};
