import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useStudentClubs = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ["student-clubs", studentId],
    queryFn: async () => {
      if (!studentId) throw new Error("Student ID required");

      const { data, error } = await supabase
        .from("club_members")
        .select(`
          club_id,
          role,
          joined_at,
          clubs (
            id,
            name,
            description,
            owner_id,
            created_at
          )
        `)
        .eq("user_id", studentId);

      if (error) throw error;

      return data?.map((member) => ({
        ...member.clubs,
        userRole: member.role,
        joinedAt: member.joined_at,
      })) || [];
    },
    enabled: !!studentId,
  });
};

export const useClubPosts = (clubId: string | undefined) => {
  return useQuery({
    queryKey: ["club-posts", clubId],
    queryFn: async () => {
      if (!clubId) throw new Error("Club ID required");

      const { data, error } = await supabase
        .from("club_posts")
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq("club_id", clubId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clubId,
  });
};
