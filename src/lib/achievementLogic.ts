import { supabase } from "@/integrations/supabase/client";

export interface AchievementCheck {
  type: string;
  earned: boolean;
  metadata?: Record<string, any>;
}

export const checkAndAwardAchievements = async (
  studentId: string,
  sessionData: {
    wpm: number;
    accuracy: number;
    wordsRead: number;
    isFirstSession?: boolean;
    gradeMode?: string;
  }
): Promise<string[]> => {
  const newAchievements: string[] = [];

  // Fetch existing achievements and stats — scope stats by gradeMode
  let statsQuery = supabase
    .from('student_reading_stats')
    .select('*')
    .eq('student_id', studentId);
  if (sessionData.gradeMode) statsQuery = statsQuery.eq('grade_mode', sessionData.gradeMode);

  const [{ data: existingAchievements }, { data: stats }, { data: profileData }] = await Promise.all([
    supabase
      .from('reading_achievements')
      .select('achievement_type')
      .eq('student_id', studentId),
    statsQuery.single(),
    supabase
      .from('profiles')
      .select('student_profiles(grade)')
      .eq('id', studentId)
      .single()
  ]);

  const grade = (profileData?.student_profiles as any)?.[0]?.grade || 3;

  const existingTypes = new Set(existingAchievements?.map(a => a.achievement_type) || []);

  const checks: AchievementCheck[] = [
    {
      type: 'first_words',
      earned: sessionData.isFirstSession === true,
    },
    {
      type: 'on_fire',
      earned: (stats?.current_streak_days || 0) >= 3,
    },
    {
      type: 'week_warrior',
      earned: (stats?.current_streak_days || 0) >= 7,
    },
    {
      type: 'month_master',
      earned: (stats?.current_streak_days || 0) >= 30,
    },
    {
      type: 'bookworm',
      earned: (stats?.total_words_read || 0) >= 1000,
      metadata: { total_words: stats?.total_words_read },
    },
    {
      type: 'sharp_shooter',
      earned: sessionData.accuracy >= 95,
      metadata: { accuracy: sessionData.accuracy },
    },
    {
      type: 'speed_demon',
      earned: sessionData.wpm > getGradeLevelBenchmark(grade),
      metadata: { wpm: sessionData.wpm, grade },
    },
  ];

  // Check phoneme mastery
  const { data: phonemeStats } = await supabase
    .from('student_error_patterns')
    .select('phoneme')
    .eq('student_id', studentId)
    .gte('correct_count', 10);

  if ((phonemeStats?.length || 0) >= 10) {
    checks.push({
      type: 'phoneme_master',
      earned: true,
      metadata: { phonemes_mastered: phonemeStats?.length },
    });
  }

  // Award new achievements
  for (const check of checks) {
    if (check.earned && !existingTypes.has(check.type)) {
      try {
        await supabase.from('reading_achievements').insert({
          student_id: studentId,
          achievement_type: check.type,
          metadata: check.metadata || {},
        });
        newAchievements.push(check.type);
      } catch (error) {
        console.error(`Failed to award achievement ${check.type}:`, error);
      }
    }
  }

  return newAchievements;
};

const getGradeLevelBenchmark = (grade: number): number => {
  const benchmarks: Record<number, number> = {
    1: 60,
    2: 90,
    3: 110,
    4: 120,
    5: 130,
  };
  return benchmarks[grade] || 100;
};

export const generateDailyMissions = async (studentId: string) => {
  const now = new Date();
  
  // First, mark any expired active missions as expired
  await supabase
    .from('reading_missions')
    .update({ status: 'expired' })
    .eq('student_id', studentId)
    .eq('status', 'active')
    .lt('expires_at', now.toISOString());
  
  // Check if missions already exist for today
  const { data: existingMissions } = await supabase
    .from('reading_missions')
    .select('*')
    .eq('student_id', studentId)
    .gte('expires_at', now.toISOString())
    .eq('status', 'active');

  if (existingMissions && existingMissions.length >= 3) {
    return; // Already have enough active missions
  }

  const existingTypes = new Set(existingMissions?.map(m => m.mission_type) || []);

  // Mission templates - rotating variety to keep it engaging
  const missionTemplates = [
    {
      mission_type: 'daily_reading',
      title: '📚 Daily Reader',
      description: 'Read for 5 minutes today',
      target_value: 300, // 5 minutes in seconds
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      mission_type: 'weekly_wpm',
      title: '🚀 Word Champion',
      description: 'Read 500 words this week',
      target_value: 500,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      mission_type: 'accuracy_master',
      title: '🎯 Accuracy Master',
      description: 'Complete 3 readings with 90%+ accuracy',
      target_value: 3,
      expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      mission_type: 'streak_builder',
      title: '🔥 Streak Builder',
      description: 'Read 3 days in a row',
      target_value: 3,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      mission_type: 'word_champion',
      title: '👑 Word Champion',
      description: 'Read 1000 words this week',
      target_value: 1000,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      mission_type: 'phoneme_hunter',
      title: '🔤 Phoneme Hunter',
      description: 'Practice 5 phonemes today',
      target_value: 5,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Add missions that don't already exist
  const missionsToAdd = missionTemplates
    .filter(m => !existingTypes.has(m.mission_type))
    .slice(0, 3 - (existingMissions?.length || 0))
    .map(m => ({
      student_id: studentId,
      ...m,
      current_value: 0,
    }));

  if (missionsToAdd.length > 0) {
    await supabase.from('reading_missions').insert(missionsToAdd);
  }
};

export const updateMissionProgress = async (
  studentId: string,
  sessionData: {
    wordsRead: number;
    durationSeconds: number;
    accuracy?: number;
    wpm?: number;
  }
) => {
  const now = new Date().toISOString();

  // Helper function to update a mission
  const updateMission = async (
    missionType: string,
    incrementValue: number
  ) => {
    const { data: mission } = await supabase
      .from('reading_missions')
      .select('*')
      .eq('student_id', studentId)
      .eq('mission_type', missionType)
      .eq('status', 'active')
      .gte('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (mission) {
      const newValue = mission.current_value + incrementValue;
      await supabase
        .from('reading_missions')
        .update({
          current_value: newValue,
          status: newValue >= mission.target_value ? 'completed' : 'active',
          completed_at: newValue >= mission.target_value ? new Date().toISOString() : null,
        })
        .eq('id', mission.id);
    }
  };

  // Update daily reading mission (tracks duration in seconds)
  await updateMission('daily_reading', sessionData.durationSeconds);

  // Update weekly WPM mission (tracks total words read)
  await updateMission('weekly_wpm', sessionData.wordsRead);

  // Update accuracy master mission (tracks sessions with 90%+ accuracy)
  if (sessionData.accuracy && sessionData.accuracy >= 90) {
    await updateMission('accuracy_master', 1);
  }

  // Update word champion mission (tracks total words)
  await updateMission('word_champion', sessionData.wordsRead);
};
