import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BehaviorStats {
  id: string;
  student_id: string;
  classroom_id: string;
  total_points: number;
  weekly_points: number;
  current_streak: number;
  best_streak: number;
  last_positive_date?: string;
}

export const useBehaviorStats = (studentId?: string, classroomId?: string) => {
  return useQuery({
    queryKey: ['behavior-stats', studentId, classroomId],
    queryFn: async () => {
      let query = supabase
        .from('student_behavior_stats')
        .select('*');

      if (studentId) {
        query = query.eq('student_id', studentId);
      }
      if (classroomId) {
        query = query.eq('classroom_id', classroomId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as BehaviorStats[];
    },
    enabled: !!studentId || !!classroomId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const useStudentBehaviorStats = (studentId: string, classroomId: string) => {
  return useQuery({
    queryKey: ['student-behavior-stats', studentId, classroomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_behavior_stats')
        .select('*')
        .eq('student_id', studentId)
        .eq('classroom_id', classroomId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as BehaviorStats | null;
    },
    enabled: !!studentId && !!classroomId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
