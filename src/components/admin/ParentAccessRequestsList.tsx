import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface ParentAccessRequest {
  id: string;
  parent_id: string;
  student_id: string;
  status: string;
  message: string;
  created_at: string;
  parent_accounts: {
    full_name: string;
    email: string;
  };
  student: {
    full_name: string;
  };
}

export const ParentAccessRequestsList = () => {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ["admin-parent-access-requests"],
    queryFn: async () => {
      console.log("🔍 [ADMIN REQUESTS] Starting fetch...");
      
      // Check authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("👤 [ADMIN REQUESTS] Session check:", {
        hasSession: !!session,
        userId: session?.user?.id,
        sessionError
      });

      if (!session) {
        console.error("❌ [ADMIN REQUESTS] No session found!");
        throw new Error("Not authenticated");
      }

      // Check user role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      
      console.log("🔑 [ADMIN REQUESTS] User roles:", {
        roles: roleData,
        roleError,
        hasAdminRole: roleData?.some(r => r.role === 'admin')
      });

      // First fetch the requests
      console.log("📊 [ADMIN REQUESTS] Fetching parent_access_requests...");
      const { data: requestsData, error: requestsError } = await supabase
        .from("parent_access_requests")
        .select("*")
        .eq("approval_type", "admin")
        .order("created_at", { ascending: false });

      console.log("📋 [ADMIN REQUESTS] Query result:", {
        requestsCount: requestsData?.length || 0,
        requestsData,
        error: requestsError,
        errorDetails: requestsError ? {
          message: requestsError.message,
          code: requestsError.code,
          details: requestsError.details,
          hint: requestsError.hint
        } : null
      });

      if (requestsError) {
        console.error("❌ [ADMIN REQUESTS] Error fetching requests:", requestsError);
        throw requestsError;
      }

      if (!requestsData || requestsData.length === 0) {
        console.log("📭 [ADMIN REQUESTS] No requests found, returning empty array");
        return [];
      }

      console.log("✅ [ADMIN REQUESTS] Found requests:", requestsData.length);

      // Fetch parent account details for each request
      const parentIds = [...new Set(requestsData.map(r => r.parent_id))];
      console.log("👪 [ADMIN REQUESTS] Fetching parent accounts for IDs:", parentIds);
      
      const { data: parentsDataRaw, error: parentsError } = await supabase
        .from("parent_accounts")
        .select("id, full_name, email")
        .in("id", parentIds);

      let parentsData = parentsDataRaw;

      console.log("👪 [ADMIN REQUESTS] Parent accounts result:", {
        parentsCount: parentsData?.length || 0,
        parentsData,
        parentsError,
        errorDetails: parentsError ? {
          message: parentsError.message,
          code: parentsError.code,
          details: parentsError.details,
          hint: parentsError.hint
        } : null
      });

      if (parentsError) {
        console.error("❌ [ADMIN REQUESTS] Error fetching parents:", {
          error: parentsError,
          message: parentsError.message,
          code: parentsError.code,
          details: parentsError.details,
          hint: parentsError.hint
        });
        
        // Don't throw - instead use fallback data
        console.warn("⚠️ [ADMIN REQUESTS] Using fallback for parent accounts");
        parentsData = requestsData.map(r => ({
          id: r.parent_id,
          full_name: "Parent",
          email: "Email unavailable"
        }));
      }

      // Fetch student profiles
      const studentIds = [...new Set(requestsData.map(r => r.student_id))];
      console.log("🎓 [ADMIN REQUESTS] Fetching student profiles for IDs:", studentIds);
      
      const { data: studentsDataRaw, error: studentsError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds);

      let studentsData = studentsDataRaw;

      console.log("🎓 [ADMIN REQUESTS] Student profiles result:", {
        studentsCount: studentsData?.length || 0,
        studentsData,
        studentsError
      });

      if (studentsError) {
        console.error("❌ [ADMIN REQUESTS] Error fetching students:", studentsError);
        
        // Don't throw - instead use fallback data
        console.warn("⚠️ [ADMIN REQUESTS] Using fallback for student profiles");
        studentsData = requestsData.map(r => ({
          id: r.student_id,
          full_name: "Student"
        }));
      }

      // Combine the data
      const enrichedRequests = requestsData.map(request => ({
        ...request,
        parent_accounts: parentsData?.find(p => p.id === request.parent_id) || { full_name: "Unknown", email: "Unknown" },
        student: studentsData?.find(s => s.id === request.student_id) || { full_name: "Unknown" }
      }));

      console.log("✅ [ADMIN REQUESTS] Final enriched requests:", enrichedRequests);
      return enrichedRequests as unknown as ParentAccessRequest[];
    },
  });

  console.log("📊 [ADMIN REQUESTS] Component render state:", {
    isLoading,
    hasError: !!error,
    error,
    requestsCount: requests?.length || 0,
    requests
  });

  if (error) {
    console.error("❌ [ADMIN REQUESTS] Query error:", error);
  }

  const handleApprove = async (requestId: string, parentId: string, studentId: string) => {
    setProcessingId(requestId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      // Update the request status
      const { error: updateError } = await supabase
        .from("parent_access_requests")
        .update({
          status: "approved",
          resolved_at: new Date().toISOString(),
          admin_id: session.user.id,
        })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Create the parent-student link
      const { error: linkError } = await supabase
        .from("parent_student_links")
        .insert({
          parent_id: parentId,
          student_id: studentId,
          approved: true,
          approved_at: new Date().toISOString(),
          approved_by: session.user.id,
        });

      if (linkError) throw linkError;

      toast.success("Parent access request approved!");
      queryClient.invalidateQueries({ queryKey: ["admin-parent-access-requests"] });
    } catch (error: any) {
      console.error("Error approving request:", error);
      toast.error(error.message || "Failed to approve request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const { error } = await supabase
        .from("parent_access_requests")
        .update({
          status: "denied",
          resolved_at: new Date().toISOString(),
          admin_id: session.user.id,
        })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Parent access request denied");
      queryClient.invalidateQueries({ queryKey: ["admin-parent-access-requests"] });
    } catch (error: any) {
      console.error("Error denying request:", error);
      toast.error(error.message || "Failed to deny request");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case "denied":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Denied</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No parent access requests found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {requests.map((request) => (
        <Card key={request.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">
                  {request.parent_accounts.full_name}
                </CardTitle>
                <CardDescription className="text-sm">
                  {request.parent_accounts.email}
                </CardDescription>
              </div>
              {getStatusBadge(request.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Student:</p>
              <p className="text-sm text-muted-foreground">{request.student.full_name}</p>
            </div>
            
            {request.message && (
              <div>
                <p className="text-sm font-medium">Message:</p>
                <p className="text-sm text-muted-foreground">{request.message}</p>
              </div>
            )}
            
            <div>
              <p className="text-xs text-muted-foreground">
                Requested: {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>

            {request.status === "pending" && (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => handleApprove(request.id, request.parent_id, request.student_id)}
                  disabled={processingId === request.id}
                  className="flex-1"
                >
                  {processingId === request.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Approve"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeny(request.id)}
                  disabled={processingId === request.id}
                  className="flex-1"
                >
                  Deny
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
