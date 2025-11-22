import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useInterventions = (studentId?: string, classroomId?: string) => {
  const queryClient = useQueryClient();

  const { data: interventions = [], isLoading } = useQuery({
    queryKey: ["interventions", studentId, classroomId],
    queryFn: async () => {
      let query = supabase.from("student_interventions").select("*");

      if (studentId) {
        query = query.eq("student_id", studentId);
      }
      if (classroomId) {
        query = query.eq("classroom_id", classroomId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId || !!classroomId,
  });

  const createIntervention = useMutation({
    mutationFn: async (intervention: {
      student_id: string;
      classroom_id: string;
      teacher_id: string;
      intervention_type: string;
      notes?: string;
      risk_score_before: number;
    }) => {
      const { data, error } = await supabase
        .from("student_interventions")
        .insert(intervention)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interventions"] });
      toast({
        title: "Intervention Created",
        description: "The intervention has been recorded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resolveIntervention = useMutation({
    mutationFn: async ({
      id,
      risk_score_after,
    }: {
      id: string;
      risk_score_after: number;
    }) => {
      const { data, error } = await supabase
        .from("student_interventions")
        .update({
          status: "resolved",
          risk_score_after,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interventions"] });
      toast({
        title: "Intervention Resolved",
        description: "The intervention has been marked as resolved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    interventions,
    isLoading,
    createIntervention: createIntervention.mutate,
    resolveIntervention: resolveIntervention.mutate,
  };
};
