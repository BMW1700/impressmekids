import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GradeMode } from "@/lib/gameTheme";

export const useReadingSessions = (studentId?: string, assignmentId?: string, gradeMode?: GradeMode) => {
  return useQuery({
    queryKey: ['reading-sessions', studentId, assignmentId, gradeMode],
    queryFn: async () => {
      let query = supabase
        .from('reading_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      if (assignmentId) {
        query = query.eq('assignment_id', assignmentId);
      }

      if (gradeMode) {
        query = query.eq('grade_mode', gradeMode);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId || !!assignmentId,
  });
};

export const useReadingStats = (studentId?: string, gradeMode?: GradeMode) => {
  return useQuery({
    queryKey: ['reading-stats', studentId, gradeMode],
    queryFn: async () => {
      if (!studentId) return null;

      let query = supabase
        .from('student_reading_stats')
        .select('*')
        .eq('student_id', studentId);

      if (gradeMode) {
        query = query.eq('grade_mode', gradeMode);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!studentId,
  });
};

export const useClassroomReadingSessions = (classroomId?: string, gradeMode?: GradeMode) => {
  return useQuery({
    queryKey: ['classroom-reading-sessions', classroomId, gradeMode],
    queryFn: async () => {
      if (!classroomId) return [];

      // Get all students in the classroom
      const { data: students, error: studentsError } = await supabase
        .from('classroom_students')
        .select('student_id')
        .eq('classroom_id', classroomId);

      if (studentsError) throw studentsError;
      if (!students || students.length === 0) return [];

      const studentIds = students.map(s => s.student_id);

      // Get all reading sessions for these students
      let query = supabase
        .from('reading_sessions')
        .select(`
          *,
          profiles:student_id (
            full_name,
            email
          )
        `)
        .in('student_id', studentIds)
        .order('created_at', { ascending: false })
        .limit(100);

      if (gradeMode) {
        query = query.eq('grade_mode', gradeMode);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!classroomId,
  });
};
