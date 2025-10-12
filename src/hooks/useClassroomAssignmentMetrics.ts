import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";

export const useClassroomAssignmentMetrics = (classroomId?: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ['classroom-assignment-metrics', classroomId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get teacher's classrooms
      const classroomQuery = supabase
        .from('classrooms')
        .select('id')
        .eq('teacher_id', user.id);
      
      if (classroomId) {
        classroomQuery.eq('id', classroomId);
      }

      const { data: classrooms } = await classroomQuery;
      if (!classrooms || classrooms.length === 0) return null;

      const classroomIds = classrooms.map(c => c.id);

      // Get all students in these classrooms
      const { data: students } = await supabase
        .from('classroom_students')
        .select('student_id')
        .in('classroom_id', classroomIds);

      const totalStudents = students?.length || 0;

      // Get all published assignments for these classrooms
      const { data: assignments } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          status,
          due_date,
          classroom_id
        `)
        .in('classroom_id', classroomIds)
        .eq('status', 'published');

      const totalAssignments = assignments?.length || 0;

      // Get all assignment submissions
      const assignmentIds = assignments?.map(a => a.id) || [];
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('*')
        .in('assignment_id', assignmentIds);

      // Calculate metrics
      const submittedCount = submissions?.filter(s => s.status === 'submitted').length || 0;
      const pendingGradingCount = submissions?.filter(s => s.status === 'submitted' && !s.graded_at).length || 0;
      
      const gradedSubmissions = submissions?.filter(s => s.grade !== null) || [];
      const avgGrade = gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + Number(s.grade), 0) / gradedSubmissions.length
        : 0;

      // Calculate completion rate
      const expectedSubmissions = totalAssignments * totalStudents;
      const completionRate = expectedSubmissions > 0
        ? (submittedCount / expectedSubmissions) * 100
        : 0;

      // Get overdue assignments
      const now = new Date();
      const overdueAssignments = assignments?.filter(a => 
        a.due_date && new Date(a.due_date) < now
      ).length || 0;

      // Get last 7 days activity for chart
      const sevenDaysAgo = subDays(new Date(), 7);
      const { data: recentSubmissions } = await supabase
        .from('assignment_submissions')
        .select('submitted_at')
        .in('assignment_id', assignmentIds)
        .gte('submitted_at', sevenDaysAgo.toISOString())
        .order('submitted_at', { ascending: true });

      // Group by day
      const submissionsByDay = recentSubmissions?.reduce((acc, record) => {
        if (record.submitted_at) {
          const day = new Date(record.submitted_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          acc[day] = (acc[day] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      const activityData = Object.entries(submissionsByDay).map(([date, count]) => ({
        date,
        submissions: count,
      }));

      return {
        totalAssignments,
        pendingGradingCount,
        avgGrade: Math.round(avgGrade),
        completionRate: Math.round(completionRate),
        overdueAssignments,
        totalSubmissions: submittedCount,
        activityData,
      };
    },
    enabled: true,
  });

  return {
    metrics: data,
    isLoading,
  };
};
