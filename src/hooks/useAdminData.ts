import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAdminData = () => {
  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ["admin-teachers"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_teachers");
      if (error) throw error;
      return data;
    },
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_students");
      if (error) throw error;
      return data;
    },
  });

  const { data: admins, isLoading: adminsLoading } = useQuery({
    queryKey: ["admin-admins"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_admins");
      if (error) throw error;
      return data;
    },
  });

  return {
    teachers,
    students,
    admins,
    isLoading: teachersLoading || studentsLoading || adminsLoading,
  };
};

export const useTeacherClassrooms = (teacherId: string | null) => {
  return useQuery({
    queryKey: ["teacher-classrooms", teacherId],
    queryFn: async () => {
      if (!teacherId) return null;
      const { data, error } = await supabase.rpc("get_teacher_classrooms", {
        p_teacher_id: teacherId,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!teacherId,
  });
};

export const useClassroomStudents = (classroomId: string | null) => {
  return useQuery({
    queryKey: ["classroom-students-admin", classroomId],
    queryFn: async () => {
      if (!classroomId) return null;
      const { data, error } = await supabase.rpc("get_classroom_students_admin", {
        p_classroom_id: classroomId,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!classroomId,
  });
};

export const useStudentClassrooms = (studentId: string | null) => {
  return useQuery({
    queryKey: ["student-classrooms-admin", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const { data, error } = await supabase.rpc("get_student_classrooms_admin", {
        p_student_id: studentId,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });
};

export const useStudentParents = (studentId: string | null) => {
  return useQuery({
    queryKey: ["student-parents-admin", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const { data, error } = await supabase.rpc("get_student_parents_admin", {
        p_student_id: studentId,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });
};
