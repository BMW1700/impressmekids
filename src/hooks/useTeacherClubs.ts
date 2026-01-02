import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface TeacherClub {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  meeting_days: string[] | null;
  start_time: string | null;
  end_time: string | null;
  schedule_start_date: string | null;
  schedule_end_date: string | null;
  created_at: string;
  member_count: number;
  pending_request_count: number;
}

export interface ClubJoinRequest {
  id: string;
  club_id: string;
  student_id: string;
  status: string;
  requested_at: string;
  student_name: string;
  student_email: string;
}

export const useTeacherClubs = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["teacher-clubs", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase.rpc("get_teacher_clubs", {
        p_teacher_id: user.id,
      });

      if (error) throw error;
      return (data || []) as TeacherClub[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
};

export const useClubDetail = (clubId: string | undefined) => {
  return useQuery({
    queryKey: ["club-detail", clubId],
    queryFn: async () => {
      if (!clubId) return null;

      const { data, error } = await supabase
        .from("clubs")
        .select("*")
        .eq("id", clubId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!clubId,
  });
};

export const useClubMembers = (clubId: string | undefined) => {
  return useQuery({
    queryKey: ["club-members", clubId],
    queryFn: async () => {
      if (!clubId) return [];

      const { data, error } = await supabase
        .from("club_members")
        .select(`
          id,
          user_id,
          role,
          joined_at,
          profiles:user_id (
            id,
            full_name,
            email
          )
        `)
        .eq("club_id", clubId)
        .order("joined_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clubId,
  });
};

export const useClubJoinRequests = (clubId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["club-join-requests", clubId],
    queryFn: async () => {
      if (!clubId) return [];

      const { data, error } = await supabase.rpc("get_club_pending_requests", {
        _club_id: clubId,
      });

      if (error) throw error;
      return (data || []) as ClubJoinRequest[];
    },
    enabled: !!clubId,
  });

  const approveRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.rpc("approve_club_join_request", {
        p_request_id: requestId,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || "Failed to approve request");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-join-requests", clubId] });
      queryClient.invalidateQueries({ queryKey: ["club-members", clubId] });
      queryClient.invalidateQueries({ queryKey: ["teacher-clubs"] });
      toast({
        title: "Student Approved",
        description: "The student has been added to the club.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Approve",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const denyRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.rpc("deny_club_join_request", {
        p_request_id: requestId,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || "Failed to deny request");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-join-requests", clubId] });
      queryClient.invalidateQueries({ queryKey: ["teacher-clubs"] });
      toast({
        title: "Request Denied",
        description: "The join request has been denied.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Deny",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    requests: requests || [],
    isLoading,
    approveRequest: approveRequest.mutate,
    denyRequest: denyRequest.mutate,
    isApproving: approveRequest.isPending,
    isDenying: denyRequest.isPending,
  };
};

export const useUpdateClub = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clubId,
      updates,
    }: {
      clubId: string;
      updates: {
        name?: string;
        description?: string;
        location?: string;
        meeting_days?: string[];
        start_time?: string;
        end_time?: string;
        schedule_start_date?: string;
        schedule_end_date?: string;
      };
    }) => {
      const { error } = await supabase
        .from("clubs")
        .update(updates)
        .eq("id", clubId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-detail"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-clubs"] });
      toast({
        title: "Club Updated",
        description: "Club settings have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
