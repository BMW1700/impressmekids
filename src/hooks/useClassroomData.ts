import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Critical data that loads immediately
export const useClassroomDetail = (classroomId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["classroom", classroomId],
    queryFn: async () => {
      if (!classroomId || !user) return null;
      
      const { data, error } = await supabase.rpc("get_classroom_detail", {
        _user_id: user.id,
        _classroom_id: classroomId,
      });
      
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!classroomId && !!user,
    staleTime: 10 * 60 * 1000, // 10 min
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useClassroomStudents = (classroomId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["classroom-students", classroomId],
    queryFn: async () => {
      if (!classroomId || !user) return [];
      
      const { data, error } = await supabase.rpc("get_classroom_students", {
        _user_id: user.id,
        _classroom_id: classroomId,
      });
      
      if (error) throw error;
      
      return (data || []).map((student: any) => ({
        id: student.id,
        student_id: student.student_id,
        joined_at: student.joined_at,
        profiles: {
          id: student.student_id,
          full_name: student.full_name,
          email: student.email,
          student_profiles: student.grade ? [{ grade: student.grade, avatar_url: student.avatar_url }] : [],
        },
      }));
    },
    enabled: !!classroomId && !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const useClassroomTournaments = (classroomId: string | undefined) => {
  return useQuery({
    queryKey: ["classroom-tournaments", classroomId],
    queryFn: async () => {
      if (!classroomId) return [];
      
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("classroom_id", classroomId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!classroomId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const useClassroomAnnouncements = (classroomId: string | undefined) => {
  return useQuery({
    queryKey: ["classroom-announcements", classroomId],
    queryFn: async () => {
      if (!classroomId) return [];
      
      const { data, error } = await supabase
        .from("classroom_announcements")
        .select("*")
        .eq("classroom_id", classroomId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!classroomId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

// Fixed: Single query instead of N+1 for parent requests
export const useClassroomParentRequests = (classroomId: string | undefined, isTeacher: boolean) => {
  return useQuery({
    queryKey: ["classroom-parent-requests", classroomId],
    queryFn: async () => {
      if (!classroomId) return [];
      
      // Single query that joins both parent_accounts AND profiles for student info
      const { data, error } = await supabase
        .from("parent_access_requests")
        .select(`
          *,
          parent_accounts!parent_id (full_name, email),
          profiles!student_id (full_name)
        `)
        .eq("classroom_id", classroomId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!classroomId && isTeacher,
    staleTime: 2 * 60 * 1000, // Parent requests should refresh more often
    gcTime: 10 * 60 * 1000,
  });
};

export const useClassroomFlashcards = (classroomId: string | undefined, isTeacher: boolean) => {
  return useQuery({
    queryKey: ["classroom-flashcards", classroomId, isTeacher],
    queryFn: async () => {
      if (!classroomId) return [];
      
      let query = supabase
        .from("flashcard_sets")
        .select("*, question_groups!question_group_id (title, subject, grade)")
        .eq("classroom_id", classroomId);
      
      if (!isTeacher) {
        query = query.eq("is_posted", true);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!classroomId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const useUserProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase.rpc("get_user_profile", {
        _user_id: user.id,
      });
      
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!user,
    staleTime: 30 * 60 * 1000, // Profile rarely changes
    gcTime: 60 * 60 * 1000,
  });
};

// Prefetch helper for instant classroom navigation
export const usePrefetchClassroom = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const prefetch = (classroomId: string) => {
    if (!user || !classroomId) return;

    // Prefetch critical data on hover
    queryClient.prefetchQuery({
      queryKey: ["classroom", classroomId],
      queryFn: async () => {
        const { data } = await supabase.rpc("get_classroom_detail", {
          _user_id: user.id,
          _classroom_id: classroomId,
        });
        return data?.[0] || null;
      },
      staleTime: 10 * 60 * 1000,
    });

    queryClient.prefetchQuery({
      queryKey: ["classroom-students", classroomId],
      queryFn: async () => {
        const { data } = await supabase.rpc("get_classroom_students", {
          _user_id: user.id,
          _classroom_id: classroomId,
        });
        return data || [];
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  return prefetch;
};
