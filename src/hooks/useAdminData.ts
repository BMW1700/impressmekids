import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAdminData = (schoolId?: string | null, districtId?: string | null, isDistrictAdmin?: boolean) => {
  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ["admin-teachers", schoolId, districtId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_teachers");
      if (error) throw error;
      
      let filteredData = data;
      
      // Filter by school if schoolId is provided
      if (schoolId && filteredData) {
        filteredData = filteredData.filter((teacher: any) => teacher.school_id === schoolId);
      } else if (districtId && filteredData) {
        // Filter by district if no specific school selected
        filteredData = filteredData.filter((teacher: any) => teacher.district_id === districtId);
      }
      
      return filteredData;
    },
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["admin-students", schoolId, districtId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_students");
      if (error) throw error;
      
      let filteredData = data;
      
      // Filter by school if schoolId is provided
      if (schoolId && filteredData) {
        filteredData = filteredData.filter((student: any) => student.school_id === schoolId);
      } else if (districtId && filteredData) {
        // Filter by district if no specific school selected
        filteredData = filteredData.filter((student: any) => student.district_id === districtId);
      }
      
      return filteredData;
    },
  });

  const { data: admins, isLoading: adminsLoading } = useQuery({
    queryKey: ["admin-admins", schoolId, districtId, isDistrictAdmin],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_admins");
      if (error) throw error;
      
      let filteredData = data;
      
      if (isDistrictAdmin && districtId) {
        // District Admin: Show all admins in their district
        filteredData = filteredData?.filter((admin: any) => 
          admin.district_id === districtId
        );
      } else if (schoolId && districtId) {
        // School Admin: Show District Admins of their district + School Admins of their school
        filteredData = filteredData?.filter((admin: any) => 
          (admin.district_id === districtId && !admin.school_id) ||  // District Admins
          admin.school_id === schoolId  // School Admins of their school
        );
      } else if (districtId) {
        // Fallback: filter by district
        filteredData = filteredData?.filter((admin: any) => 
          admin.district_id === districtId
        );
      }
      
      // Sort: District Admins first (school_id is null), then School Admins
      filteredData?.sort((a: any, b: any) => {
        const aIsDistrictAdmin = !a.school_id;
        const bIsDistrictAdmin = !b.school_id;
        if (aIsDistrictAdmin && !bIsDistrictAdmin) return -1;
        if (!aIsDistrictAdmin && bIsDistrictAdmin) return 1;
        return 0;
      });
      
      return filteredData;
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
