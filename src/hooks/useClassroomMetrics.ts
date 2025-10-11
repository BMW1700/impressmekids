import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";

export const useClassroomMetrics = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['classroom-metrics'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get teacher's classrooms
      const { data: classrooms } = await supabase
        .from('classrooms')
        .select('id')
        .eq('teacher_id', user.id);

      if (!classrooms || classrooms.length === 0) return null;

      const classroomIds = classrooms.map(c => c.id);

      // Get all students in classrooms
      const { data: students } = await supabase
        .from('classroom_students')
        .select('student_id')
        .in('classroom_id', classroomIds);

      if (!students || students.length === 0) return null;

      const studentIds = students.map(s => s.student_id);

      // Get AURA records from last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30);
      const { data: recentRecords } = await supabase
        .from('aura_records')
        .select('*')
        .in('profile_id', studentIds)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      // Get older records (30-60 days ago)
      const sixtyDaysAgo = subDays(new Date(), 60);
      const { data: olderRecords } = await supabase
        .from('aura_records')
        .select('*')
        .in('profile_id', studentIds)
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString());

      // Calculate WPM improvement
      const recentAvgWpm = recentRecords && recentRecords.length > 0
        ? recentRecords.reduce((sum, r) => sum + r.wpm, 0) / recentRecords.length
        : 0;

      const olderAvgWpm = olderRecords && olderRecords.length > 0
        ? olderRecords.reduce((sum, r) => sum + r.wpm, 0) / olderRecords.length
        : 0;

      const wpmImprovement = olderAvgWpm > 0
        ? ((recentAvgWpm - olderAvgWpm) / olderAvgWpm) * 100
        : 0;

      // Get last 7 days activity for chart
      const sevenDaysAgo = subDays(new Date(), 7);
      const { data: weekActivity } = await supabase
        .from('aura_records')
        .select('created_at')
        .in('profile_id', studentIds)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      // Group by day
      const activityByDay = weekActivity?.reduce((acc, record) => {
        const day = new Date(record.created_at).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const activityData = Object.entries(activityByDay).map(([date, count]) => ({
        date,
        sessions: count,
      }));

      return {
        wpmImprovement: Math.round(wpmImprovement),
        recentAvgWpm: Math.round(recentAvgWpm),
        olderAvgWpm: Math.round(olderAvgWpm),
        totalSessions: recentRecords?.length || 0,
        activityData,
      };
    },
  });

  return {
    metrics: data,
    isLoading,
  };
};
