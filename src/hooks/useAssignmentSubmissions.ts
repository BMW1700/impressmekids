import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAssignmentSubmissions = (assignmentId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['assignment-submissions', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return [];

      const { data, error } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          profiles!student_id (
            id,
            full_name,
            email
          )
        `)
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      
      // Filter to latest attempt per student
      const submissionsMap = new Map<string, any>();
      (data || []).forEach((submission: any) => {
        const studentId = submission.student_id;
        const existing = submissionsMap.get(studentId);
        
        // Keep submission with highest attempt_number
        if (!existing || submission.attempt_number > existing.attempt_number) {
          submissionsMap.set(studentId, submission);
        }
      });

      return Array.from(submissionsMap.values())
        .sort((a, b) => {
          // Sort by submission date, most recent first
          if (!a.submitted_at) return 1;
          if (!b.submitted_at) return -1;
          return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
        });
    },
    enabled: !!assignmentId,
  });

  const gradeSubmission = useMutation({
    mutationFn: async ({
      submissionId,
      grade,
      feedback,
    }: {
      submissionId: string;
      grade: number;
      feedback: string;
    }) => {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .update({
          grade,
          teacher_feedback: feedback,
          graded_at: new Date().toISOString(),
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions'] });
      toast({
        title: "Success",
        description: "Grade and feedback saved!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save grade.",
        variant: "destructive",
      });
      console.error('Grade submission error:', error);
    },
  });

  return {
    submissions: submissions || [],
    isLoading,
    gradeSubmission: gradeSubmission.mutate,
  };
};
