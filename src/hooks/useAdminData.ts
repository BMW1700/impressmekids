import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAdminData = (schoolId?: string | null) => {
  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ["admin-teachers", schoolId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_teachers");
      if (error) throw error;
      // Filter by school if schoolId is provided
      if (schoolId && data) {
        return data.filter((teacher: any) => teacher.school_id === schoolId);
      }
      return data;
    },
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["admin-students", schoolId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_students");
      if (error) throw error;
      // Filter by school if schoolId is provided
      if (schoolId && data) {
        return data.filter((student: any) => student.school_id === schoolId);
      }
      return data;
    },
  });

  const { data: admins, isLoading: adminsLoading } = useQuery({
    queryKey: ["admin-admins", schoolId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_admins");
      if (error) throw error;
      // Filter by school if schoolId is provided
      if (schoolId && data) {
        return data.filter((admin: any) => admin.school_id === schoolId);
      }
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
