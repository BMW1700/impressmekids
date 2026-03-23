import { supabase } from "@/integrations/supabase/client";

/**
 * Shared utility to upsert student_reading_stats after any reading session.
 * Used by GuidedReadingFlow (SingleWordReader + full-passage) and BattleReader.
 */
export const updateStudentReadingStats = async (
  studentId: string,
  sessionData: {
    wordsRead: number;
    xpEarned: number;
  }
) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: existingStats } = await supabase
      .from('student_reading_stats')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (existingStats) {
      const lastActivity = existingStats.last_activity_date;
      let newStreak = existingStats.current_streak_days || 1;

      if (lastActivity) {
        const lastDate = new Date(lastActivity);
        const todayDate = new Date(today);
        const diffDays = Math.floor(
          (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
        // diffDays === 0 → same day, keep streak
      }

      const longestStreak = Math.max(
        existingStats.longest_streak_days || 0,
        newStreak
      );

      await supabase
        .from('student_reading_stats')
        .update({
          total_words_read: (existingStats.total_words_read || 0) + sessionData.wordsRead,
          total_sessions: (existingStats.total_sessions || 0) + 1,
          current_streak_days: newStreak,
          longest_streak_days: longestStreak,
          xp_points: (existingStats.xp_points || 0) + sessionData.xpEarned,
          last_activity_date: today,
        })
        .eq('student_id', studentId);
    } else {
      await supabase.from('student_reading_stats').insert({
        student_id: studentId,
        total_words_read: sessionData.wordsRead,
        total_sessions: 1,
        current_streak_days: 1,
        longest_streak_days: 1,
        xp_points: sessionData.xpEarned,
        last_activity_date: today,
      });
    }
  } catch (error) {
    console.error('Error updating student reading stats:', error);
  }
};
