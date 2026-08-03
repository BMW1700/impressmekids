import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Loader2 } from "lucide-react";

interface StudentPinResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentUserId: string;
  studentName: string;
}

/**
 * Teacher-facing PIN reset for the class-code login.
 *
 * Five wrong PINs locks a child out for 15 minutes; this clears the lockout
 * and issues a fresh 6-digit PIN. The plaintext PIN is shown exactly once —
 * only the hash is stored.
 */
export function StudentPinResetDialog({
  open,
  onOpenChange,
  studentUserId,
  studentName,
}: StudentPinResetDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newPin, setNewPin] = useState<string | null>(null);

  const handleReset = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("reset-student-pin", {
        body: { student_user_id: studentUserId },
      });

      let details: { pin?: string; error?: string } | null = (data ?? null) as any;
      if (error) {
        try {
          const raw = await (error as any)?.context?.text?.();
          details = raw ? JSON.parse(raw) : null;
        } catch {
          /* ignore */
        }
        toast({
          title: "Could not reset PIN",
          description: details?.error ?? "Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!details?.pin) {
        toast({
          title: "Could not reset PIN",
          description: details?.error ?? "This student has no classroom login yet.",
          variant: "destructive",
        });
        return;
      }

      setNewPin(details.pin);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (next: boolean) => {
    if (!next) setNewPin(null);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Reset class PIN
          </DialogTitle>
          <DialogDescription>
            {newPin
              ? `Write this down now — it is shown only once.`
              : `This gives ${studentName} a brand-new 6-digit PIN and clears any lockout right away.`}
          </DialogDescription>
        </DialogHeader>

        {newPin && (
          <div className="rounded-lg border-2 border-primary/30 bg-muted/40 p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">New PIN for {studentName}</p>
            <p className="font-mono text-4xl font-bold tracking-[0.3em]">{newPin}</p>
          </div>
        )}

        <DialogFooter>
          {newPin ? (
            <Button onClick={() => handleClose(false)}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleReset} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Reset PIN
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
