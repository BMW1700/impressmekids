import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Shield, Trash2, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function DataPrivacy() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedChild, setSelectedChild] = useState<{ id: string; name: string } | null>(null);
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Fetch parent account
  const { data: parentAccount } = useQuery({
    queryKey: ["parent-account", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.rpc("get_parent_account", { _user_id: user.id });
      return data?.[0] || null;
    },
    enabled: !!user?.id,
  });

  // Fetch linked children
  const { data: children, isLoading: childrenLoading } = useQuery({
    queryKey: ["parent-children", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.rpc("get_parent_children", { _user_id: user.id });
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch existing deletion requests
  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["deletion-requests", parentAccount?.id],
    queryFn: async () => {
      if (!parentAccount?.id) return [];
      const { data, error } = await supabase
        .from("data_deletion_requests")
        .select("*")
        .eq("parent_id", parentAccount.id)
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!parentAccount?.id,
  });

  const submitMutation = useMutation({
    mutationFn: async ({ studentId, reason }: { studentId: string; reason: string }) => {
      if (!parentAccount?.id) throw new Error("Parent account not found");
      const { error } = await supabase
        .from("data_deletion_requests")
        .insert({
          parent_id: parentAccount.id,
          student_id: studentId,
          reason,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deletion request submitted. An admin will review it shortly.");
      queryClient.invalidateQueries({ queryKey: ["deletion-requests"] });
      setSelectedChild(null);
      setReason("");
      setConfirmOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit request");
    },
  });

  const handleSubmit = () => {
    if (!selectedChild || !reason.trim()) return;
    submitMutation.mutate({ studentId: selectedChild.id, reason: reason.trim() });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pending Review</Badge>;
      case "approved":
        return <Badge className="gap-1 bg-amber-500"><Clock className="h-3 w-3" />Approved - Processing</Badge>;
      case "completed":
        return <Badge className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Completed</Badge>;
      case "denied":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Denied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Check if a child already has a pending/approved request
  const hasPendingRequest = (studentId: string) =>
    requests?.some((r: any) => r.student_id === studentId && (r.status === "pending" || r.status === "approved"));

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-secondary/[0.06] via-secondary/[0.02] to-primary/[0.03]">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/parent/dashboard")} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <div className="icon-circle icon-circle-purple">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Data & Privacy</h1>
            <p className="text-muted-foreground">Manage your child's data and request deletion per COPPA requirements</p>
          </div>
        </div>

        {/* Request Deletion Section */}
        <Card variant="glass" className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Request Data Deletion
            </CardTitle>
            <CardDescription>
              Select a child and provide a reason to request deletion of all their data from our platform.
              An administrator will review your request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {childrenLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !children || children.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No linked children found.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {children.map((child: any) => {
                  const pending = hasPendingRequest(child.student_id);
                  return (
                    <Button
                      key={child.student_id}
                      variant={selectedChild?.id === child.student_id ? "default" : "outline"}
                      className="justify-start h-auto py-3 px-4"
                      disabled={pending}
                      onClick={() =>
                        setSelectedChild(
                          selectedChild?.id === child.student_id
                            ? null
                            : { id: child.student_id, name: child.full_name }
                        )
                      }
                    >
                      <div className="text-left">
                        <div className="font-medium">{child.full_name}</div>
                        {child.grade && <div className="text-xs opacity-70">Grade {child.grade}</div>}
                        {pending && <div className="text-xs text-amber-500 mt-1">Request already pending</div>}
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}

            {selectedChild && (
              <div className="space-y-3 pt-4 border-t">
                <label className="text-sm font-medium">
                  Reason for deletion request <span className="text-destructive">*</span>
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please explain why you're requesting data deletion..."
                  maxLength={1000}
                  className="min-h-[100px]"
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{reason.length}/1000</span>
                  <Button
                    variant="destructive"
                    onClick={() => setConfirmOpen(true)}
                    disabled={!reason.trim() || submitMutation.isPending}
                  >
                    {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Submit Deletion Request
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Requests */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Request History</CardTitle>
            <CardDescription>Track the status of your data deletion requests</CardDescription>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !requests || requests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No deletion requests yet.</p>
            ) : (
              <div className="space-y-4">
                {requests.map((req: any) => {
                  const child = children?.find((c: any) => c.student_id === req.student_id);
                  return (
                    <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card/50">
                      <div className="space-y-1">
                        <div className="font-medium">{child?.full_name || "Student"}</div>
                        <div className="text-sm text-muted-foreground">{req.reason}</div>
                        <div className="text-xs text-muted-foreground">
                          Requested {format(new Date(req.requested_at), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                        {req.review_notes && (
                          <div className="text-sm text-muted-foreground mt-1">
                            <span className="font-medium">Admin notes:</span> {req.review_notes}
                          </div>
                        )}
                      </div>
                      {getStatusBadge(req.status)}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Data Deletion Request</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are requesting deletion of <strong>all data</strong> for{" "}
                <strong>{selectedChild?.name}</strong>. This includes:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Reading assessments and AURA records</li>
                <li>Assignment submissions and grades</li>
                <li>Behavior records and attendance</li>
                <li>Classroom memberships</li>
                <li>All analytics and progress data</li>
                <li>Medical/safety information</li>
              </ul>
              <p className="font-medium text-destructive">
                This action cannot be undone once processed by an administrator.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
