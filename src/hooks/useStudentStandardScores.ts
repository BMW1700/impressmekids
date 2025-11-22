import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useStudentStandardScores = (studentId?: string, classroomId?: string) => {
  return useQuery({
    queryKey: ["student-standard-scores", studentId, classroomId],
    queryFn: async () => {
      if (!studentId || !classroomId) return null;

      const { data, error } = await supabase
        .from("student_standard_scores")
        .select(`
          *,
          learning_standards (
            id,
            code,
            description,
            subject,
            category,
            grade
          )
        `)
        .eq("student_id", studentId)
        .eq("classroom_id", classroomId)
        .order("mastery_percentage", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!studentId && !!classroomId,
  });
};

export const useClassroomStandardScores = (classroomId?: string) => {
  return useQuery({
    queryKey: ["classroom-standard-scores", classroomId],
    queryFn: async () => {
      if (!classroomId) return null;

      const { data, error } = await supabase
        .from("student_standard_scores")
        .select(`
          *,
          learning_standards (
            id,
            code,
            description,
            subject,
            category,
            grade
          ),
          profiles!student_standard_scores_student_id_fkey (
            id,
            full_name
          )
        `)
        .eq("classroom_id", classroomId);

      if (error) throw error;
      return data;
    },
    enabled: !!classroomId,
  });
};
