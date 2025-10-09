import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAssignmentStats = (assignmentId?: string) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['assignment-stats', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return null;

      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('status, graded_at')
        .eq('assignment_id', assignmentId);

      if (error) throw error;

      const submissions = data || [];
      const total = submissions.length;
      const submitted = submissions.filter(s => s.status === 'submitted').length;
      const graded = submissions.filter(s => s.graded_at !== null).length;
      const inProgress = submissions.filter(s => s.status === 'in_progress').length;

      return {
        total,
        submitted,
        graded,
        inProgress,
        notStarted: total - submitted - inProgress,
      };
    },
    enabled: !!assignmentId,
  });

  return {
    stats: stats || { total: 0, submitted: 0, graded: 0, inProgress: 0, notStarted: 0 },
    isLoading,
  };
};
