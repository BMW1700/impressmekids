import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useTeacherClassrooms = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["teacher-classrooms", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase.rpc("get_teacher_classrooms", {
        p_teacher_id: user.id,
      });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min - classrooms don't change often
    gcTime: 30 * 60 * 1000, // 30 min cache
  });
};

export const useTeacherStudentCount = (classroomIds: string[]) => {
  return useQuery({
    queryKey: ["teacher-student-count", classroomIds],
    queryFn: async () => {
      if (classroomIds.length === 0) return 0;
      
      const { data, error } = await supabase
        .from("classroom_students")
        .select("classroom_id", { count: "exact", head: false })
        .in("classroom_id", classroomIds);
      
      if (error) throw error;
      return data?.length || 0;
    },
    enabled: classroomIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const useTeacherActiveAssignments = (classroomIds: string[]) => {
  return useQuery({
    queryKey: ["teacher-active-assignments", classroomIds],
    queryFn: async () => {
      if (classroomIds.length === 0) return 0;
      
      const { count, error } = await supabase
        .from("assignments")
        .select("*", { count: "exact", head: true })
        .in("classroom_id", classroomIds)
        .or(`due_date.gte.${new Date().toISOString()},due_date.is.null`);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: classroomIds.length > 0,
    staleTime: 2 * 60 * 1000, // 2 min - assignments change more often
    gcTime: 10 * 60 * 1000,
  });
};

export const useTeacherAllStudents = (classrooms: any[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["teacher-all-students", classrooms.map(c => c.id)],
    queryFn: async () => {
      if (!user || classrooms.length === 0) return [];
      const classroomIds = classrooms.map((classroom) => classroom.id);
      const { data: students, error } = await supabase
        .from("classroom_students")
        .select(`
          classroom_id,
          student_id,
          joined_at,
          profiles:student_id (
            id,
            full_name,
            email
          )
        `)
        .in("classroom_id", classroomIds)
        .order("joined_at", { ascending: true });

      if (error) throw error;

      const studentsByClassroom = (students || []).reduce<Record<string, any[]>>((acc, student: any) => {
        if (!student.profiles) return acc;
        acc[student.classroom_id] = acc[student.classroom_id] || [];
        acc[student.classroom_id].push({
          id: student.profiles.id,
          full_name: student.profiles.full_name,
          email: student.profiles.email,
          joined_at: student.joined_at,
        });
        return acc;
      }, {});

      const classroomsWithStudents = classrooms.map((classroom) => ({
        id: classroom.id,
        name: classroom.name,
        subject: classroom.subject,
        grade: classroom.grade,
        students: studentsByClassroom[classroom.id] || [],
      }));

      return classroomsWithStudents;
    },
    enabled: !!user && classrooms.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

// Combined hook for convenience
export const useTeacherDashboardData = () => {
  const classroomsQuery = useTeacherClassrooms();
  const classroomIds = (classroomsQuery.data || []).map((c: any) => c.id);
  
  const studentCountQuery = useTeacherStudentCount(classroomIds);
  const activeAssignmentsQuery = useTeacherActiveAssignments(classroomIds);

  return {
    classrooms: classroomsQuery.data || [],
    classroomsLoading: classroomsQuery.isLoading,
    studentCount: studentCountQuery.data || 0,
    activeAssignmentsCount: activeAssignmentsQuery.data || 0,
    isLoading: classroomsQuery.isLoading,
    refetch: () => {
      classroomsQuery.refetch();
      studentCountQuery.refetch();
      activeAssignmentsQuery.refetch();
    },
  };
};
