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
  }
): Promise<string[]> => {
  const newAchievements: string[] = [];

  // Fetch existing achievements and stats
  const [{ data: existingAchievements }, { data: stats }, { data: profileData }] = await Promise.all([
    supabase
      .from('reading_achievements')
      .select('achievement_type')
      .eq('student_id', studentId),
    supabase
      .from('student_reading_stats')
      .select('*')
      .eq('student_id', studentId)
      .single(),
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
  const today = new Date().toISOString().split('T')[0];
  
  // Check if missions already exist for today
  const { data: existingMissions } = await supabase
    .from('reading_missions')
    .select('*')
    .eq('student_id', studentId)
    .gte('expires_at', today)
    .eq('status', 'active');

  if (existingMissions && existingMissions.length > 0) {
    return; // Missions already generated
  }

  const missions = [
    {
      student_id: studentId,
      mission_type: 'daily_reading',
      title: 'Daily Reader',
      description: 'Read for 5 minutes today',
      target_value: 300, // 5 minutes in seconds
      current_value: 0,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      student_id: studentId,
      mission_type: 'weekly_wpm',
      title: 'Speed Challenge',
      description: 'Read 500 words this week',
      target_value: 500,
      current_value: 0,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  await supabase.from('reading_missions').insert(missions);
};

export const updateMissionProgress = async (
  studentId: string,
  sessionData: {
    wordsRead: number;
    durationSeconds: number;
  }
) => {
  // Update daily reading mission
  const { data: dailyMission } = await supabase
    .from('reading_missions')
    .select('*')
    .eq('student_id', studentId)
    .eq('mission_type', 'daily_reading')
    .eq('status', 'active')
    .single();

  if (dailyMission) {
    const newValue = dailyMission.current_value + sessionData.durationSeconds;
    await supabase
      .from('reading_missions')
      .update({
        current_value: newValue,
        status: newValue >= dailyMission.target_value ? 'completed' : 'active',
        completed_at: newValue >= dailyMission.target_value ? new Date().toISOString() : null,
      })
      .eq('id', dailyMission.id);
  }

  // Update weekly WPM mission
  const { data: weeklyMission } = await supabase
    .from('reading_missions')
    .select('*')
    .eq('student_id', studentId)
    .eq('mission_type', 'weekly_wpm')
    .eq('status', 'active')
    .single();

  if (weeklyMission) {
    const newValue = weeklyMission.current_value + sessionData.wordsRead;
    await supabase
      .from('reading_missions')
      .update({
        current_value: newValue,
        status: newValue >= weeklyMission.target_value ? 'completed' : 'active',
        completed_at: newValue >= weeklyMission.target_value ? new Date().toISOString() : null,
      })
      .eq('id', weeklyMission.id);
  }
};
