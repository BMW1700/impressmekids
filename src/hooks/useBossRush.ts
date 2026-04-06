import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BossRushAttempt {
  id: string;
  studentId: string;
  startedAt: Date;
  endedAt: Date | null;
  status: 'in_progress' | 'completed' | 'failed';
  currentBossIndex: number;
  bossesDefeated: number;
  totalDamageDealt: number;
  totalWordsRead: number;
  totalXpEarned: number;
  totalGoldEarned: number;
  longestStreak: number;
  timeTakenSeconds: number | null;
}

export interface BossRushStats {
  bossesDefeated: number;
  totalDamageDealt: number;
  totalWordsRead: number;
  totalXpEarned: number;
  totalGoldEarned: number;
  longestStreak: number;
}

export const useBossRush = (studentId: string, gradeMode?: string) => {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentBossIndex, setCurrentBossIndex] = useState(0);
  const [stats, setStats] = useState<BossRushStats>({
    bossesDefeated: 0,
    totalDamageDealt: 0,
    totalWordsRead: 0,
    totalXpEarned: 0,
    totalGoldEarned: 0,
    longestStreak: 0,
  });
  
  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Start timer
  useEffect(() => {
    if (isActive && !timerIntervalRef.current) {
      startTimeRef.current = new Date();
      timerIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const now = new Date();
          const elapsed = Math.floor((now.getTime() - startTimeRef.current.getTime()) / 1000);
          setElapsedSeconds(elapsed);
        }
      }, 1000);
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isActive]);

  // Start a new Boss Rush attempt
  const startBossRush = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('boss_rush_attempts')
        .insert({
          student_id: studentId,
          status: 'in_progress',
          current_boss_index: 0,
          bosses_defeated: 0,
          total_damage_dealt: 0,
          total_words_read: 0,
          total_xp_earned: 0,
          total_gold_earned: 0,
          longest_streak: 0,
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('[useBossRush] Failed to start attempt:', error);
        return false;
      }
      
      setAttemptId(data.id);
      setIsActive(true);
      setCurrentBossIndex(0);
      setStats({
        bossesDefeated: 0,
        totalDamageDealt: 0,
        totalWordsRead: 0,
        totalXpEarned: 0,
        totalGoldEarned: 0,
        longestStreak: 0,
      });
      setElapsedSeconds(0);
      
      console.log('[useBossRush] Started attempt:', data.id);
      return true;
    } catch (err) {
      console.error('[useBossRush] Error starting attempt:', err);
      return false;
    }
  }, [studentId]);

  // Record a boss defeat
  const recordBossDefeat = useCallback(async (bossStats: {
    damageDealt: number;
    wordsRead: number;
    xpEarned: number;
    goldEarned: number;
    longestStreak: number;
  }) => {
    if (!attemptId) return false;
    
    const newBossesDefeated = stats.bossesDefeated + 1;
    const newStats = {
      bossesDefeated: newBossesDefeated,
      totalDamageDealt: stats.totalDamageDealt + bossStats.damageDealt,
      totalWordsRead: stats.totalWordsRead + bossStats.wordsRead,
      totalXpEarned: stats.totalXpEarned + bossStats.xpEarned,
      totalGoldEarned: stats.totalGoldEarned + bossStats.goldEarned,
      longestStreak: Math.max(stats.longestStreak, bossStats.longestStreak),
    };
    
    setStats(newStats);
    setCurrentBossIndex(prev => prev + 1);
    
    try {
      const { error } = await supabase
        .from('boss_rush_attempts')
        .update({
          current_boss_index: currentBossIndex + 1,
          bosses_defeated: newBossesDefeated,
          total_damage_dealt: newStats.totalDamageDealt,
          total_words_read: newStats.totalWordsRead,
          total_xp_earned: newStats.totalXpEarned,
          total_gold_earned: newStats.totalGoldEarned,
          longest_streak: newStats.longestStreak,
        })
        .eq('id', attemptId);
      
      if (error) {
        console.error('[useBossRush] Failed to update attempt:', error);
      }
      
      return true;
    } catch (err) {
      console.error('[useBossRush] Error updating attempt:', err);
      return false;
    }
  }, [attemptId, stats, currentBossIndex]);

  // Complete Boss Rush (all 9 bosses defeated)
  const completeBossRush = useCallback(async () => {
    if (!attemptId) return false;
    
    // Stop timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    try {
      const { error } = await supabase
        .from('boss_rush_attempts')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
          time_taken_seconds: elapsedSeconds,
        })
        .eq('id', attemptId);
      
      if (error) {
        console.error('[useBossRush] Failed to complete attempt:', error);
        return false;
      }
      
      // Also update campaign_progress with boss rush stats — scoped by gradeMode
      let updateQuery = supabase
        .from('campaign_progress')
        .update({
          boss_rush_completions: supabase.rpc ? 1 : 1,
          boss_rush_unlocked: true,
        })
        .eq('student_id', studentId);
      if (gradeMode) updateQuery = updateQuery.eq('grade_mode', gradeMode);
      
      const { error: progressError } = await updateQuery;
      
      if (progressError) {
        console.warn('[useBossRush] Failed to update campaign progress:', progressError);
      }
      
      setIsActive(false);
      console.log('[useBossRush] Completed attempt in', elapsedSeconds, 'seconds');
      return true;
    } catch (err) {
      console.error('[useBossRush] Error completing attempt:', err);
      return false;
    }
  }, [attemptId, elapsedSeconds, studentId, gradeMode]);

  // Fail Boss Rush (player defeated)
  const failBossRush = useCallback(async () => {
    if (!attemptId) return false;
    
    // Stop timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    try {
      const { error } = await supabase
        .from('boss_rush_attempts')
        .update({
          status: 'failed',
          ended_at: new Date().toISOString(),
          time_taken_seconds: elapsedSeconds,
        })
        .eq('id', attemptId);
      
      if (error) {
        console.error('[useBossRush] Failed to mark attempt as failed:', error);
        return false;
      }
      
      setIsActive(false);
      console.log('[useBossRush] Failed attempt at boss', currentBossIndex);
      return true;
    } catch (err) {
      console.error('[useBossRush] Error failing attempt:', err);
      return false;
    }
  }, [attemptId, elapsedSeconds, currentBossIndex]);

  // Cancel/abandon Boss Rush
  const cancelBossRush = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsActive(false);
    setAttemptId(null);
    setCurrentBossIndex(0);
    setStats({
      bossesDefeated: 0,
      totalDamageDealt: 0,
      totalWordsRead: 0,
      totalXpEarned: 0,
      totalGoldEarned: 0,
      longestStreak: 0,
    });
    setElapsedSeconds(0);
  }, []);

  // Format elapsed time as MM:SS
  const formattedTime = `${Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`;

  return {
    isActive,
    currentBossIndex,
    stats,
    elapsedSeconds,
    formattedTime,
    startBossRush,
    recordBossDefeat,
    completeBossRush,
    failBossRush,
    cancelBossRush,
  };
};