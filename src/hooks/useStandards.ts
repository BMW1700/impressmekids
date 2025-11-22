import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useStandards = (grade?: number, subject?: string) => {
  return useQuery({
    queryKey: ["learning-standards", grade, subject],
    queryFn: async () => {
      let query = supabase
        .from("learning_standards")
        .select("*")
        .order("code", { ascending: true });

      if (grade !== undefined) {
        query = query.eq("grade", grade);
      }

      if (subject) {
        query = query.eq("subject", subject);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useAssignmentStandards = (assignmentId: string) => {
  return useQuery({
    queryKey: ["assignment-standards", assignmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignment_standards")
        .select(`
          id,
          standard_id,
          learning_standards (
            id,
            code,
            description,
            subject,
            category
          )
        `)
        .eq("assignment_id", assignmentId);

      if (error) throw error;
      return data;
    },
    enabled: !!assignmentId,
  });
};
