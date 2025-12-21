import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Check, X, Clock } from "lucide-react";
import { usePendingStudentRequests } from "@/hooks/usePendingStudentRequests";
import { useQueryClient } from "@tanstack/react-query";

interface PendingStudentRequestsProps {
  classroomId: string;
  onApproved?: () => void;
}

export const PendingStudentRequests = ({ classroomId, onApproved }: PendingStudentRequestsProps) => {
  const { requests, isLoading, approveRequest, denyRequest, isApproving, isDenying } = usePendingStudentRequests(classroomId);
  const queryClient = useQueryClient();

  const handleApprove = async (requestId: string) => {
    approveRequest(requestId, {
      onSuccess: () => {
        // Refresh the students list after approval
        queryClient.invalidateQueries({ queryKey: ["classroom-students"] });
        onApproved?.();
      },
    });
  };

  if (isLoading) {
    return (
      <Card className="mb-6 border-2 border-amber-500/20 bg-amber-500/5">
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-lg">Pending Join Requests</CardTitle>
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-700">
            {requests.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-4 rounded-lg bg-background/80 border border-border/50"
            >
              <div className="flex-1">
                <div className="font-medium">{request.student_name}</div>
                <div className="text-sm text-muted-foreground">{request.student_email}</div>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Requested {new Date(request.requested_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/30 text-red-600 hover:bg-red-500/10"
                  onClick={() => denyRequest(request.id)}
                  disabled={isApproving || isDenying}
                >
                  {isDenying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Deny
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleApprove(request.id)}
                  disabled={isApproving || isDenying}
                >
                  {isApproving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
