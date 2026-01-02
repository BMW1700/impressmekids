import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface BrowseClub {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  owner_id: string;
  owner_name: string | null;
  member_count: number;
  request_status: string | null;
}

export const useBrowseClubs = (searchQuery: string = "") => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["browse-clubs", searchQuery, user?.id],
    queryFn: async () => {
      // Get all clubs
      let query = supabase
        .from("clubs")
        .select(`
          id,
          name,
          description,
          location,
          owner_id,
          profiles:owner_id (full_name)
        `)
        .order("name");

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const { data: clubs, error } = await query;

      if (error) throw error;

      // Get member counts for each club
      const clubIds = clubs?.map(c => c.id) || [];
      
      const { data: memberCounts } = await supabase
        .from("club_members")
        .select("club_id")
        .in("club_id", clubIds);

      const countMap = (memberCounts || []).reduce((acc: Record<string, number>, m) => {
        acc[m.club_id] = (acc[m.club_id] || 0) + 1;
        return acc;
      }, {});

      // Get current user's request statuses
      let requestStatusMap: Record<string, string> = {};
      if (user) {
        const { data: requests } = await supabase
          .from("club_join_requests")
          .select("club_id, status")
          .eq("student_id", user.id)
          .in("club_id", clubIds);

        requestStatusMap = (requests || []).reduce((acc: Record<string, string>, r) => {
          acc[r.club_id] = r.status;
          return acc;
        }, {});

        // Also check if user is already a member
        const { data: memberships } = await supabase
          .from("club_members")
          .select("club_id")
          .eq("user_id", user.id)
          .in("club_id", clubIds);

        (memberships || []).forEach(m => {
          requestStatusMap[m.club_id] = "member";
        });
      }

      return (clubs || []).map(club => ({
        id: club.id,
        name: club.name,
        description: club.description,
        location: club.location,
        owner_id: club.owner_id,
        owner_name: (club.profiles as any)?.full_name || null,
        member_count: countMap[club.id] || 0,
        request_status: requestStatusMap[club.id] || null,
      })) as BrowseClub[];
    },
    enabled: true,
  });
};

export const useJoinClubRequest = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clubId: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");

      const { error } = await supabase.from("club_join_requests").insert({
        club_id: clubId,
        student_id: session.session.user.id,
        status: "pending",
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error("You have already requested to join this club");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["browse-clubs"] });
      toast({
        title: "Request Sent",
        description: "Your request to join has been sent to the club owner.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
