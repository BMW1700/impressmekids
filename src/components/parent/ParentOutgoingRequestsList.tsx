import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface ParentOutgoingRequestsListProps {
  parentId: string;
}

interface ParentAccessRequest {
  id: string;
  student_id: string;
  status: string;
  message: string | null;
  created_at: string;
  student_name: string;
}

export const ParentOutgoingRequestsList = ({ parentId }: ParentOutgoingRequestsListProps) => {
  const { data: requests, isLoading, error, refetch } = useQuery({
    queryKey: ["parent-access-requests", parentId],
    queryFn: async () => {
      console.log("🔍 Fetching parent access requests for parentId:", parentId);
      
      // RLS policy already filters by parent_id using get_parent_id(auth.uid())
      // No need to add redundant filter here
      const { data: requestsData, error: requestsError } = await supabase
        .from("parent_access_requests")
        .select("id, student_id, status, message, created_at")
        .order("created_at", { ascending: false });

      if (requestsError) {
        console.error("❌ Error fetching parent access requests:", requestsError);
        throw requestsError;
      }
      
      console.log("✅ Fetched requests:", requestsData?.length || 0, "requests");
      
      if (!requestsData || requestsData.length === 0) {
        console.log("📭 No requests found");
        return [];
      }

      // Fetch student names for each request
      const studentIds = requestsData.map(r => r.student_id);
      const { data: studentsData, error: studentsError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds);

      if (studentsError) {
        console.error("❌ Error fetching student profiles:", studentsError);
        throw studentsError;
      }

      const studentMap = new Map(studentsData?.map(s => [s.id, s.full_name]) || []);

      const enrichedRequests = requestsData.map(request => ({
        ...request,
        student_name: studentMap.get(request.student_id) || "Unknown Student"
      })) as ParentAccessRequest[];
      
      console.log("✅ Enriched requests with student names:", enrichedRequests);
      
      return enrichedRequests;
    },
    refetchOnMount: true, // Force fresh fetch on mount to bust stale cache
    retry: 1, // Retry once if RLS fails
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "denied":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Denied
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    console.error("💥 Error displaying requests:", error);
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-destructive">
              Failed to load access requests: {error.message}
            </p>
            <button 
              onClick={() => refetch()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              No student access requests yet. Click "Link Student" to get started.
            </p>
            <button 
              onClick={() => refetch()} 
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Refresh
            </button>
          </div>
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
              <CardTitle className="text-lg">
                {request.student_name}
              </CardTitle>
              {getStatusBadge(request.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Requested: </span>
                {format(new Date(request.created_at), "MMM d, yyyy")}
              </div>
              {request.message && (
                <div>
                  <span className="text-muted-foreground">Message: </span>
                  <p className="mt-1 text-foreground">{request.message}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
