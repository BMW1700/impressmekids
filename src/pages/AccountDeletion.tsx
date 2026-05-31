import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { ArrowLeft, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

/**
 * Self-service account deletion page (Apple Guideline 5.1.1(v)).
 *
 * Reachable in ≤3 taps: Settings menu → "Delete my account" → confirm.
 * Calls the `self-delete-account` edge function which:
 *  - Cascades deletion across every user-scoped table
 *  - Removes the auth.users row
 *  - Invalidates the session
 */
export default function AccountDeletion() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [typed, setTyped] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canConfirm = typed.trim().toUpperCase() === "DELETE";

  const handleDelete = async () => {
    if (!user) {
      toast.error("You are not signed in.");
      return;
    }
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("self-delete-account", {
        body: { confirm: "DELETE_MY_ACCOUNT" },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      toast.success("Your account has been permanently deleted.");
      try {
        await signOut?.();
      } catch {
        await supabase.auth.signOut().catch(() => {});
      }
      navigate("/", { replace: true });
    } catch (err) {
      console.error("[AccountDeletion] failed:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Deletion failed. Please email support@nabulearn.com."
      );
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>You must be signed in to delete your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/auth")}>Sign in</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="border-destructive/40">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-destructive/10 p-2">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle>Delete my account</CardTitle>
                <CardDescription>
                  This permanently erases your NabuLearn account and personal data.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">This action cannot be undone.</p>
                  <p className="text-muted-foreground">
                    We will delete your profile, reading history, AURA recordings,
                    game progress, classroom memberships, parent-child links,
                    notifications, and sign-in credentials.
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground pt-2">
                Aggregated, fully-anonymized statistics that cannot identify
                you may be retained for service-improvement purposes, in
                line with our Privacy Policy.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Type <span className="font-mono text-destructive">DELETE</span> to confirm
              </label>
              <Input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="destructive"
                disabled={!canConfirm || deleting}
                onClick={() => setConfirmOpen(true)}
                className="flex-1"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Permanently delete my account
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={deleting}
              >
                Cancel
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Need help instead?{" "}
              <a href="mailto:support@nabulearn.com" className="underline">
                Contact support
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your account and all associated personal data
              from NabuLearn. You will be signed out immediately. This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Yes, delete forever"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
