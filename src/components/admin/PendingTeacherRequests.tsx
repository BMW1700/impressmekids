import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";

interface PendingTeacherRequest {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  requested_at: string;
  status: string;
}

export function PendingTeacherRequests() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['pending-teacher-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_teacher_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data as PendingTeacherRequest[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (request: PendingTeacherRequest) => {
      // Update user role to teacher
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: 'teacher' })
        .eq('id', request.user_id);

      if (roleError) throw roleError;

      // Update request status
      const { error: statusError } = await supabase
        .from('pending_teacher_requests')
        .update({ 
          status: 'approved',
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (statusError) throw statusError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-teacher-requests'] });
      toast({
        title: "Teacher Approved",
        description: "The user has been granted teacher access.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('pending_teacher_requests')
        .update({ 
          status: 'rejected',
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-teacher-requests'] });
      toast({
        title: "Request Rejected",
        description: "The teacher access request has been rejected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
  const reviewedRequests = requests?.filter(r => r.status !== 'pending') || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Teacher Requests ({pendingRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No pending teacher requests
            </p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{request.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{request.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Requested: {format(new Date(request.requested_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => approveMutation.mutate(request)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectMutation.mutate(request.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {reviewedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Decisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reviewedRequests.slice(0, 10).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{request.full_name}</h3>
                    <p className="text-xs text-muted-foreground">{request.email}</p>
                  </div>
                  <Badge variant={request.status === 'approved' ? 'default' : 'destructive'}>
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
