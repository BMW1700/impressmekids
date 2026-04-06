import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SmartNotification {
  type: 'practice_reminder' | 'improvement' | 'milestone' | 'recommendation' | 'streak';
  title: string;
  message: string;
  action?: {
    label: string;
    path: string;
  };
}

export const useSmartNotifications = (gradeMode?: string) => {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['smart-notifications', gradeMode],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const notifications: SmartNotification[] = [];

      // Fetch student reading stats
      let statsQuery = supabase
        .from('student_reading_stats')
        .select('*')
        .eq('student_id', user.id);
      if (gradeMode) statsQuery = statsQuery.eq('grade_mode', gradeMode);
      const { data: stats } = await statsQuery.single();

      if (!stats) return notifications;

      // Check last practice date for phonemes
      const lastPracticeDate = new Date(stats.updated_at);
      const daysSinceLastPractice = Math.floor(
        (Date.now() - lastPracticeDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Practice Reminder (3+ days inactive)
      if (daysSinceLastPractice >= 3) {
        notifications.push({
          type: 'practice_reminder',
          title: 'Time to Practice! 📚',
          message: `You haven't practiced in ${daysSinceLastPractice} days. Let's keep your skills sharp!`,
          action: {
            label: 'Practice Now',
            path: '/student/aura-practice'
          }
        });
      }

      // Streak Notification
      if (stats.current_streak_days && stats.current_streak_days >= 3) {
        notifications.push({
          type: 'streak',
          title: `🔥 ${stats.current_streak_days}-Day Streak!`,
          message: 'Amazing consistency! Keep it up to maintain your streak.',
          action: {
            label: 'Read More',
            path: '/student/aura-practice'
          }
        });
      }

      // Improvement Notification (WPM growth)
      let sessionsQuery = supabase
        .from('reading_sessions')
        .select('wpm')
        .eq('student_id', user.id);
      if (gradeMode) sessionsQuery = sessionsQuery.eq('grade_mode', gradeMode);
      const { data: recentSessions } = await sessionsQuery
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentSessions && recentSessions.length >= 5) {
        const recentAvg = recentSessions.slice(0, 5).reduce((sum, s) => sum + s.wpm, 0) / 5;
        const olderAvg = recentSessions.slice(5).reduce((sum, s) => sum + s.wpm, 0) / (recentSessions.length - 5);
        const improvement = ((recentAvg - olderAvg) / olderAvg) * 100;

        if (improvement >= 10) {
          notifications.push({
            type: 'improvement',
            title: '📈 Great Progress!',
            message: `Your reading speed improved ${Math.round(improvement)}% this week!`,
          });
        }
      }

      // Milestone Notification (total words read)
      const totalWords = stats.total_words_read || 0;
      const milestones = [1000, 5000, 10000, 25000, 50000, 100000];
      const nextMilestone = milestones.find(m => m > totalWords);
      const lastMilestone = milestones.filter(m => m <= totalWords).pop();

      if (lastMilestone && totalWords - lastMilestone < 100) {
        notifications.push({
          type: 'milestone',
          title: '🎯 Milestone Reached!',
          message: `Congratulations! You've read ${lastMilestone.toLocaleString()} words!`,
        });
      } else if (nextMilestone) {
        const wordsToGo = nextMilestone - totalWords;
        if (wordsToGo <= 500) {
          notifications.push({
            type: 'milestone',
            title: '🎯 Almost There!',
            message: `Just ${wordsToGo} more words until your next milestone!`,
            action: {
              label: 'Keep Reading',
              path: '/student/aura-practice'
            }
          });
        }
      }

      // Category Completion Recommendation
      let progressQuery = supabase
        .from('student_reading_progress')
        .select('reading_library(category)')
        .eq('student_id', user.id)
        .eq('completed', true);
      if (gradeMode) progressQuery = progressQuery.eq('grade_mode', gradeMode);
      const { data: progress } = await progressQuery;

      if (progress) {
        const categoryCounts: Record<string, number> = {};
        progress.forEach(p => {
          const category = p.reading_library?.category;
          if (category) {
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          }
        });

        // Find categories close to completion (assuming 8 stories per category)
        Object.entries(categoryCounts).forEach(([category, count]) => {
          if (count >= 6 && count < 8) {
            const remaining = 8 - count;
            notifications.push({
              type: 'recommendation',
              title: '📚 Complete a Category!',
              message: `You're only ${remaining} ${remaining === 1 ? 'story' : 'stories'} away from completing the ${category.replace('_', ' ')} category!`,
              action: {
                label: 'View Stories',
                path: `/student/aura-practice?tab=stories&category=${encodeURIComponent(category)}`
              }
            });
          }
        });
      }

      // Limit to 3 most important notifications
      return notifications.slice(0, 3);
    },
    refetchInterval: 60000 // Refetch every minute
  });

  return {
    notifications: notifications || [],
    loading: isLoading
  };
};
