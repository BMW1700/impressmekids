import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useStudentSubmissionAttempts = (assignmentId?: string, studentId?: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ['student-submission-attempts', assignmentId, studentId],
    queryFn: async () => {
      if (!assignmentId || !studentId) return null;

      // Get assignment max_attempts
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .select('max_attempts')
        .eq('id', assignmentId)
        .single();

      if (assignmentError) throw assignmentError;

      // Get all submissions for this student+assignment
      const { data: submissions, error: submissionsError } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .order('attempt_number', { ascending: false });

      if (submissionsError) throw submissionsError;

      const maxAttempts = assignment?.max_attempts || 1;
      const completedSubmissions = submissions?.filter(s => s.status === 'submitted') || [];
      const inProgressSubmission = submissions?.find(s => s.status === 'in_progress');
      const canStartNewAttempt = completedSubmissions.length < maxAttempts && !inProgressSubmission;
      const attemptsRemaining = maxAttempts - completedSubmissions.length;

      return {
        submissions: submissions || [],
        completedSubmissions,
        inProgressSubmission,
        maxAttempts,
        canStartNewAttempt,
        attemptsRemaining,
      };
    },
    enabled: !!assignmentId && !!studentId,
  });

  return {
    ...data,
    isLoading,
  };
};
