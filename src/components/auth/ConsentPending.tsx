import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, Clock } from "lucide-react";

interface ConsentPendingProps {
  open: boolean;
  parentEmail: string;
  onClose: () => void;
}

export function ConsentPending({ open, parentEmail, onClose }: ConsentPendingProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">Verification Email Sent!</DialogTitle>
          <DialogDescription className="text-center">
            We've sent a verification email to <strong>{parentEmail}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">What's Next?</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Your parent checks their email inbox</li>
                <li>They click the verification link</li>
                <li>You'll be able to complete your account setup</li>
              </ol>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            The verification link expires in 48 hours. If you don't receive the email, check your spam folder.
          </p>

          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
