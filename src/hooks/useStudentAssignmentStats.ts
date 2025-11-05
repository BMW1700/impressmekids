import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useStudentAssignmentStats = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ["student-assignment-stats", studentId],
    queryFn: async () => {
      if (!studentId) return null;

      const { data, error } = await supabase
        .rpc("get_student_assignment_stats", {
          _student_id: studentId,
        })
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });
};
