import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useStudentClassrooms = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["student-classrooms", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase.rpc("get_student_classroom_context", {
        _student_id: user.id,
      });

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        subject: row.subject,
        grade: row.grade,
        join_code: row.join_code,
        teacher_id: row.teacher_id,
        created_at: row.created_at,
        profiles: { full_name: row.teacher_full_name },
        joined_at: row.joined_at,
      }));
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const useStudentProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          student_profiles (grade, avatar_url)
        `)
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 30 * 60 * 1000, // 30 min - profile rarely changes
    gcTime: 60 * 60 * 1000,
  });
};

export const useStudentAnnouncements = (classroomIds: string[]) => {
  return useQuery({
    queryKey: ["student-announcements", classroomIds],
    queryFn: async () => {
      if (classroomIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("classroom_announcements")
        .select(`
          *,
          classrooms:classroom_id (name)
        `)
        .in("classroom_id", classroomIds)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: classroomIds.length > 0,
    staleTime: 2 * 60 * 1000, // 2 min - announcements can be time-sensitive
    gcTime: 10 * 60 * 1000,
  });
};

export const useStudentUpcomingAssignments = (classroomIds: string[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["student-upcoming-assignments", classroomIds, user?.id],
    queryFn: async () => {
      if (classroomIds.length === 0 || !user) return [];
      
      const now = new Date().toISOString();
      
      // Get assignments
      const { data: assignments, error } = await supabase
        .from("assignments")
        .select(`
          id,
          title,
          due_date,
          category,
          classroom_id,
          classrooms:classroom_id (name)
        `)
        .in("classroom_id", classroomIds)
        .eq("is_posted", true)
        .gte("due_date", now)
        .order("due_date", { ascending: true })
        .limit(10);
      
      if (error) throw error;
      
      // Get submissions for these assignments
      const assignmentIds = (assignments || []).map(a => a.id);
      if (assignmentIds.length === 0) return [];
      
      const { data: submissions } = await supabase
        .from("assignment_submissions")
        .select("assignment_id, status")
        .in("assignment_id", assignmentIds)
        .eq("student_id", user.id);
      
      const submissionMap = new Map(
        (submissions || []).map(s => [s.assignment_id, s.status])
      );
      
      return (assignments || []).map(a => ({
        ...a,
        submissionStatus: submissionMap.get(a.id) || null,
      }));
    },
    enabled: classroomIds.length > 0 && !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Combined hook for convenience
export const useStudentDashboardData = () => {
  const classroomsQuery = useStudentClassrooms();
  const profileQuery = useStudentProfile();
  const classroomIds = (classroomsQuery.data || []).map((c: any) => c.id);
  
  const announcementsQuery = useStudentAnnouncements(classroomIds);
  const upcomingAssignmentsQuery = useStudentUpcomingAssignments(classroomIds);

  return {
    classrooms: classroomsQuery.data || [],
    profile: profileQuery.data,
    announcements: announcementsQuery.data || [],
    upcomingAssignments: upcomingAssignmentsQuery.data || [],
    isLoading: classroomsQuery.isLoading || profileQuery.isLoading,
    refetch: () => {
      classroomsQuery.refetch();
      profileQuery.refetch();
      announcementsQuery.refetch();
      upcomingAssignmentsQuery.refetch();
    },
  };
};
