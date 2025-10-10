import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useTeacherSummary = (classroomId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch latest summary for classroom
  const { data: summary, isLoading } = useQuery({
    queryKey: ['teacher-summary', classroomId],
    queryFn: async () => {
      if (!classroomId) return null;

      const { data, error } = await supabase
        .from('teacher_summaries')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!classroomId,
  });

  // Generate new summary
  const generateSummary = useMutation({
    mutationFn: async (classroomId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-teacher-summary', {
        body: { classroom_id: classroomId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-summary', classroomId] });
      
      if (data.cached) {
        toast({
          title: "Using Cached Summary",
          description: `Generated ${data.hours_ago} hour${data.hours_ago !== 1 ? 's' : ''} ago. Fresh summaries available once per day.`,
        });
      } else {
        toast({
          title: "Summary Generated",
          description: "AI insights have been generated for this classroom.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    summary,
    isLoading,
    generateSummary: generateSummary.mutate,
    isGenerating: generateSummary.isPending,
  };
};
