import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useStudentProfile = (studentId?: string) => {
  // Fetch all student data in one hook
  const { data, isLoading } = useQuery({
    queryKey: ['student-profile', studentId],
    queryFn: async () => {
      if (!studentId) return null;

      // Get current user to determine access level
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if current user is parent of this student
      const { data: parentChildInfo } = await supabase.rpc(
        'get_parent_child_info',
        { _parent_user_id: user.id, _student_id: studentId }
      );

      // If parent has access, use that data; otherwise use own profile
      let profile;
      if (parentChildInfo && parentChildInfo.length > 0) {
        profile = {
          id: parentChildInfo[0].student_id,
          full_name: parentChildInfo[0].full_name,
          email: parentChildInfo[0].email,
        };
      } else if (user.id === studentId) {
        // User viewing their own profile - full access
        const { data: ownProfile, error: profileError } = await supabase
          .rpc('get_user_profile', { _user_id: studentId });
        
        if (profileError) throw profileError;
        profile = ownProfile?.[0] || null;
      } else {
        // No access to sensitive data
        profile = null;
      }

      // Fetch public profile (display info only)
      const { data: publicProfile, error: publicProfileError } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('id', studentId)
        .maybeSingle();

      if (publicProfileError && publicProfileError.code !== 'PGRST116') {
        throw publicProfileError;
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
        studentProfile: publicProfile,
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
