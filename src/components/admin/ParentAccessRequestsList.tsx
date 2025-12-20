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

      // Get admin's district_id
      const { data: adminProfile, error: profileError } = await supabase
        .from("profiles")
        .select("district_id")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        console.error("❌ [ADMIN REQUESTS] Error fetching admin profile:", profileError);
        throw profileError;
      }

      const adminDistrictId = adminProfile?.district_id;
      console.log("🏫 [ADMIN REQUESTS] Admin district_id:", adminDistrictId);

      // First fetch the requests
      console.log("📊 [ADMIN REQUESTS] Fetching parent_access_requests...");
      const { data: requestsData, error: requestsError } = await supabase
        .from("parent_access_requests")
        .select("*")
        .eq("approval_type", "admin")
        .order("created_at", { ascending: false });

      if (requestsError) {
        console.error("❌ [ADMIN REQUESTS] Error fetching requests:", requestsError);
        throw requestsError;
      }

      if (!requestsData || requestsData.length === 0) {
        console.log("📭 [ADMIN REQUESTS] No requests found, returning empty array");
        return [];
      }

      // Get all student IDs from requests
      const studentIdsFromRequests = [...new Set(requestsData.map(r => r.student_id))];
      
      // Fetch student profiles with district info to filter by district
      const { data: studentsWithDistrict, error: districtStudentsError } = await supabase
        .from("profiles")
        .select("id, full_name, district_id")
        .in("id", studentIdsFromRequests);

      if (districtStudentsError) {
        console.error("❌ [ADMIN REQUESTS] Error fetching students for district filter:", districtStudentsError);
        throw districtStudentsError;
      }

      // Filter to only students in the admin's district
      const studentsInDistrict = studentsWithDistrict?.filter(
        s => adminDistrictId ? s.district_id === adminDistrictId : true
      ) || [];
      const studentIdsInDistrict = new Set(studentsInDistrict.map(s => s.id));

      // Filter requests to only those for students in the admin's district
      const filteredRequests = requestsData.filter(r => studentIdsInDistrict.has(r.student_id));

      console.log("📋 [ADMIN REQUESTS] Filtered requests for district:", {
        totalRequests: requestsData.length,
        filteredCount: filteredRequests.length,
        adminDistrictId
      });

      if (filteredRequests.length === 0) {
        console.log("📭 [ADMIN REQUESTS] No requests found for this district");
        return [];
      }

      // Fetch parent account details for each request
      const parentIds = [...new Set(filteredRequests.map(r => r.parent_id))];
      console.log("👪 [ADMIN REQUESTS] Fetching parent accounts for IDs:", parentIds);
      
      const { data: parentsDataRaw, error: parentsError } = await supabase
        .from("parent_accounts")
        .select("id, full_name, email")
        .in("id", parentIds);

      let parentsData = parentsDataRaw;

      if (parentsError) {
        console.error("❌ [ADMIN REQUESTS] Error fetching parents:", parentsError);
        // Don't throw - instead use fallback data
        parentsData = filteredRequests.map(r => ({
          id: r.parent_id,
          full_name: "Parent",
          email: "Email unavailable"
        }));
      }

      // Use the already fetched student data
      const studentsData = studentsInDistrict;

      // Combine the data
      const enrichedRequests = filteredRequests.map(request => ({
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

  const pendingRequests = requests?.filter(r => r.status === "pending") || [];
  const approvedRequests = requests?.filter(r => r.status === "approved") || [];

  if (!requests || requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No parent access requests found</p>
        </CardContent>
      </Card>
    );
  }

  const renderRequestCard = (request: ParentAccessRequest, showActions: boolean) => (
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

        {showActions && request.status === "pending" && (
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
  );

  return (
    <div className="space-y-8">
      {/* Pending Requests Section */}
      <div className="space-y-4">
        {pendingRequests.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingRequests.map((request) => renderRequestCard(request, true))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No pending requests</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Approved Requests Section */}
      {approvedRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Approved Requests</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {approvedRequests.map((request) => renderRequestCard(request, false))}
          </div>
        </div>
      )}
    </div>
  );
};
