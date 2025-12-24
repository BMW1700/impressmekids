import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Shared hook to fetch classroom IDs for a student.
 * This eliminates duplicate queries across parent dashboard components.
 */
export const useStudentClassroomIds = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ["student-classroom-ids", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from("classroom_students")
        .select("classroom_id")
        .eq("student_id", studentId);
      
      if (error) throw error;
      return data?.map((c) => c.classroom_id) || [];
    },
    enabled: !!studentId,
    staleTime: 10 * 60 * 1000, // 10 minutes - classroom enrollment rarely changes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  });
};
