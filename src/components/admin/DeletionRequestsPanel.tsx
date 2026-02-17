import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Check, X, Trash2, Loader2, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function DeletionRequestsPanel() {
  const queryClient = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionDialog, setActionDialog] = useState<{
    type: "approve" | "deny";
    requestId: string;
    studentName: string;
  } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-deletion-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_deletion_requests")
        .select("*")
        .order("requested_at", { ascending: false });
      if (error) throw error;

      // Fetch parent and student names
      if (!data || data.length === 0) return [];

      const parentIds = [...new Set(data.map((r) => r.parent_id))];
      const studentIds = [...new Set(data.map((r) => r.student_id))];

      const [{ data: parents }, { data: students }] = await Promise.all([
        supabase.from("parent_accounts").select("id, full_name, email").in("id", parentIds),
        supabase.from("profiles").select("id, full_name, email").in("id", studentIds),
      ]);

      const parentMap = Object.fromEntries((parents || []).map((p) => [p.id, p]));
      const studentMap = Object.fromEntries((students || []).map((s) => [s.id, s]));

      return data.map((r) => ({
        ...r,
        parent_name: parentMap[r.parent_id]?.full_name || "Unknown",
        parent_email: parentMap[r.parent_id]?.email || "",
        student_name: studentMap[r.student_id]?.full_name || "Unknown",
        student_email: studentMap[r.student_id]?.email || "",
      }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      requestId,
      status,
      notes,
    }: {
      requestId: string;
      status: "approved" | "denied";
      notes: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("data_deletion_requests")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          review_notes: notes || null,
        })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(`Request ${vars.status === "approved" ? "approved" : "denied"} successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin-deletion-requests"] });
      setActionDialog(null);
      setReviewNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update request");
    },
  });

  const processMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.functions.invoke("process-data-deletion", {
        body: { request_id: requestId, action: "process" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Data deletion completed. ${data.deleted_tables?.length || 0} data categories removed.`);
      queryClient.invalidateQueries({ queryKey: ["admin-deletion-requests"] });
      setProcessingId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to process deletion");
      setProcessingId(null);
    },
  });

  const handleAction = () => {
    if (!actionDialog) return;
    updateMutation.mutate({
      requestId: actionDialog.requestId,
      status: actionDialog.type === "approve" ? "approved" : "denied",
      notes: reviewNotes,
    });
  };

  const handleProcess = (requestId: string) => {
    setProcessingId(requestId);
    processMutation.mutate(requestId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case "approved":
        return <Badge className="gap-1 bg-amber-500"><Clock className="h-3 w-3" />Approved</Badge>;
      case "completed":
        return <Badge className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Completed</Badge>;
      case "denied":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Denied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = requests?.filter((r: any) => r.status === "pending").length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Data Deletion Requests
          {pendingCount > 0 && (
            <Badge variant="destructive">{pendingCount} pending</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Review and process parent requests for student data deletion (COPPA compliance)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !requests || requests.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No deletion requests</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parent</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req: any) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{req.parent_name}</div>
                        <div className="text-xs text-muted-foreground">{req.parent_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{req.student_name}</div>
                        <div className="text-xs text-muted-foreground">{req.student_email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={req.reason}>
                      {req.reason}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(req.requested_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {req.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() =>
                                setActionDialog({
                                  type: "approve",
                                  requestId: req.id,
                                  studentName: req.student_name,
                                })
                              }
                            >
                              <Check className="h-3 w-3" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() =>
                                setActionDialog({
                                  type: "deny",
                                  requestId: req.id,
                                  studentName: req.student_name,
                                })
                              }
                            >
                              <X className="h-3 w-3" /> Deny
                            </Button>
                          </>
                        )}
                        {req.status === "approved" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            disabled={processingId === req.id}
                            onClick={() => handleProcess(req.id)}
                          >
                            {processingId === req.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                            Process Deletion
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog?.type === "approve" ? "Approve" : "Deny"} Deletion Request
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog?.type === "approve"
                ? `Approving will allow you to process data deletion for ${actionDialog?.studentName}. You'll still need to click "Process Deletion" to execute.`
                : `Denying this request means the student data for ${actionDialog?.studentName} will NOT be deleted.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add any notes about this decision..."
              maxLength={500}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={
                actionDialog?.type === "approve"
                  ? ""
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {actionDialog?.type === "approve" ? "Approve" : "Deny"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
