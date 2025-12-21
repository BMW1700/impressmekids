import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PendingStudentRequest {
  id: string;
  classroom_id: string;
  student_id: string;
  status: string;
  requested_at: string;
  student_name: string;
  student_email: string;
}

export const usePendingStudentRequests = (classroomId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["pending-student-requests", classroomId],
    queryFn: async () => {
      if (!classroomId) return [];

      const { data, error } = await supabase
        .from("classroom_join_requests")
        .select("*")
        .eq("classroom_id", classroomId)
        .eq("status", "pending")
        .order("requested_at", { ascending: false });

      if (error) throw error;

      // Fetch student names for each request
      const enrichedRequests = await Promise.all(
        (data || []).map(async (request) => {
          const { data: studentData } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", request.student_id)
            .single();

          return {
            ...request,
            student_name: studentData?.full_name || "Unknown Student",
            student_email: studentData?.email || "",
          };
        })
      );

      return enrichedRequests as PendingStudentRequest[];
    },
    enabled: !!classroomId,
  });

  const approveRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.rpc("approve_student_join_request", {
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
      queryClient.invalidateQueries({ queryKey: ["pending-student-requests", classroomId] });
      toast({
        title: "Student Approved",
        description: "The student has been added to the classroom.",
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
      const { data, error } = await supabase.rpc("deny_student_join_request", {
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
      queryClient.invalidateQueries({ queryKey: ["pending-student-requests", classroomId] });
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
