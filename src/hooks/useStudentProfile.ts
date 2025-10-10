import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useStudentProfile = (studentId?: string) => {
  // Fetch all student data in one hook
  const { data, isLoading } = useQuery({
    queryKey: ['student-profile', studentId],
    queryFn: async () => {
      if (!studentId) return null;

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single();

      if (profileError) throw profileError;

      // Fetch student profile details
      const { data: studentProfile, error: studentProfileError } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', studentId)
        .maybeSingle();

      if (studentProfileError && studentProfileError.code !== 'PGRST116') {
        throw studentProfileError;
      }

      // Fetch skill vector
      const { data: skillVector, error: skillVectorError } = await supabase
        .from('student_skill_vectors')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (skillVectorError && skillVectorError.code !== 'PGRST116') {
        throw skillVectorError;
      }

      // Fetch AURA records (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: auraRecords, error: auraError } = await supabase
        .from('aura_records')
        .select('*')
        .eq('profile_id', studentId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (auraError) throw auraError;

      // Fetch recent assignments/submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          assignments (
            id,
            title,
            assignment_type,
            classroom_id
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (submissionsError) throw submissionsError;

      // Fetch classrooms
      const { data: classrooms, error: classroomsError } = await supabase
        .from('classroom_students')
        .select(`
          classroom_id,
          classrooms (
            id,
            name
          )
        `)
        .eq('student_id', studentId);

      if (classroomsError) throw classroomsError;

      return {
        profile,
        studentProfile,
        skillVector,
        auraRecords: auraRecords || [],
        submissions: submissions || [],
        classrooms: classrooms || [],
      };
    },
    enabled: !!studentId,
  });

  // Calculate longitudinal metrics
  const longitudinalMetrics = data?.auraRecords 
    ? calculateLongitudinalMetrics(data.auraRecords)
    : null;

  // Build activity timeline
  const activityTimeline = data 
    ? buildActivityTimeline(data.auraRecords, data.submissions)
    : [];

  return {
    profile: data?.profile,
    studentProfile: data?.studentProfile,
    skillVector: data?.skillVector,
    auraRecords: data?.auraRecords || [],
    submissions: data?.submissions || [],
    classrooms: data?.classrooms || [],
    longitudinalMetrics,
    activityTimeline,
    isLoading,
  };
};

// Helper: Calculate metrics over time
function calculateLongitudinalMetrics(auraRecords: any[]) {
  if (!auraRecords || auraRecords.length === 0) return null;

  const sortedRecords = [...auraRecords].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return {
    clarityOverTime: sortedRecords.map(r => ({
      date: new Date(r.created_at),
      value: r.clarity
    })),
    paceOverTime: sortedRecords.map(r => ({
      date: new Date(r.created_at),
      value: r.pace
    })),
    confidenceOverTime: sortedRecords.map(r => ({
      date: new Date(r.created_at),
      value: r.confidence
    })),
    sessionsCount: sortedRecords.length,
    avgClarity: sortedRecords.reduce((sum, r) => sum + r.clarity, 0) / sortedRecords.length,
    avgPace: sortedRecords.reduce((sum, r) => sum + r.pace, 0) / sortedRecords.length,
    avgConfidence: sortedRecords.reduce((sum, r) => sum + r.confidence, 0) / sortedRecords.length,
  };
}

// Helper: Build unified timeline
function buildActivityTimeline(auraRecords: any[], submissions: any[]) {
  const timeline: any[] = [];

  // Add AURA records
  auraRecords.forEach(record => {
    timeline.push({
      type: 'aura',
      date: new Date(record.created_at),
      data: record
    });
  });

  // Add submissions
  submissions.forEach(submission => {
    timeline.push({
      type: 'assignment',
      date: new Date(submission.created_at),
      data: submission
    });
  });

  // Sort by date (most recent first)
  return timeline.sort((a, b) => b.date.getTime() - a.date.getTime());
}
