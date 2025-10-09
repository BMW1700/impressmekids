import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSubmission = (assignmentId?: string, studentId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', assignmentId, studentId],
    queryFn: async () => {
      if (!assignmentId || !studentId) return null;

      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!assignmentId && !!studentId,
  });

  const createOrUpdateSubmission = useMutation({
    mutationFn: async ({
      assignmentId,
      studentId,
      status,
    }: {
      assignmentId: string;
      studentId: string;
      status: string;
    }) => {
      // Try to get existing submission
      const { data: existing } = await supabase
        .from('assignment_submissions')
        .select('id')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('assignment_submissions')
          .update({ 
            status,
            submitted_at: status === 'submitted' ? new Date().toISOString() : undefined
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('assignment_submissions')
          .insert({
            assignment_id: assignmentId,
            student_id: studentId,
            status,
            submitted_at: status === 'submitted' ? new Date().toISOString() : undefined
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['submission'] });
      if (variables.status === 'submitted') {
        toast({
          title: "Success!",
          description: "Assignment submitted successfully.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save submission.",
        variant: "destructive",
      });
      console.error('Submission error:', error);
    },
  });

  return {
    submission,
    isLoading,
    createOrUpdateSubmission: createOrUpdateSubmission.mutate,
  };
};
