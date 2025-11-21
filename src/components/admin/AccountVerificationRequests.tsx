import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock, GraduationCap, Users, Heart } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VerificationRequest {
  id: string;
  user_id: string;
  profile_id: string;
  district_id: string;
  district_code: string;
  district_name: string;
  full_name: string;
  email: string;
  requested_role: string;
  status: string;
  created_at: string;
}

export function AccountVerificationRequests() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['account-verification-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_verification_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VerificationRequest[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (request: VerificationRequest) => {
      // Step 1: Mark profile as verified
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', request.profile_id);

      if (profileError) throw profileError;

      // Step 2: Update verification request
      const { data: { user } } = await supabase.auth.getUser();
      const { error: requestError } = await supabase
        .from('account_verification_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', request.id);

      if (requestError) throw requestError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-verification-requests'] });
      toast({
        title: "Account Approved",
        description: "The user account has been verified and activated.",
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

  const denyMutation = useMutation({
    mutationFn: async (request: VerificationRequest) => {
      // Step 1: Update request status
      const { data: { user } } = await supabase.auth.getUser();
      const { error: requestError } = await supabase
        .from('account_verification_requests')
        .update({
          status: 'denied',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', request.id);

      if (requestError) throw requestError;

      // Step 2: Delete user account via edge function
      const { error: deleteError } = await supabase.functions.invoke('delete-user-account', {
        body: { userId: request.user_id }
      });

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-verification-requests'] });
      toast({
        title: "Account Denied",
        description: "The account request has been denied and the account deleted.",
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

  const studentRequests = requests?.filter(r => r.requested_role === 'student') || [];
  const parentRequests = requests?.filter(r => r.requested_role === 'parent') || [];
  const teacherRequests = requests?.filter(r => r.requested_role === 'teacher') || [];

  const renderRequests = (roleRequests: VerificationRequest[], roleIcon: any, roleLabel: string) => {
    const RoleIcon = roleIcon;
    
    if (roleRequests.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No pending {roleLabel.toLowerCase()} requests
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {roleRequests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-4 border rounded-lg bg-card"
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <RoleIcon className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">{request.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{request.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{request.district_name}</Badge>
                <span>•</span>
                <span>Requested: {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => approveMutation.mutate(request)}
                disabled={approveMutation.isPending || denyMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => denyMutation.mutate(request)}
                disabled={approveMutation.isPending || denyMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Deny & Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Account Verification Requests
            </CardTitle>
            <CardDescription>
              Review and approve or deny account requests from students, parents, and teachers
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {requests?.length || 0} Pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="student" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Students ({studentRequests.length})
            </TabsTrigger>
            <TabsTrigger value="parent" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Parents ({parentRequests.length})
            </TabsTrigger>
            <TabsTrigger value="teacher" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Teachers ({teacherRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="student" className="mt-6">
            {renderRequests(studentRequests, GraduationCap, "Student")}
          </TabsContent>

          <TabsContent value="parent" className="mt-6">
            {renderRequests(parentRequests, Heart, "Parent")}
          </TabsContent>

          <TabsContent value="teacher" className="mt-6">
            {renderRequests(teacherRequests, Users, "Teacher")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
