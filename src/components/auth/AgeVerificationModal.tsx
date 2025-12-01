import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AgeVerificationModalProps {
  open: boolean;
  onSelectAge: (isUnder13: boolean) => void;
}

export function AgeVerificationModal({ open, onSelectAge }: AgeVerificationModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Age Verification</DialogTitle>
          <DialogDescription>
            To comply with children's privacy laws (COPPA), we need to verify your age.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            Are you under 13 years old?
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => onSelectAge(true)}
            >
              <span className="text-lg">Yes</span>
              <span className="text-xs text-muted-foreground">I'm under 13</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => onSelectAge(false)}
            >
              <span className="text-lg">No</span>
              <span className="text-xs text-muted-foreground">I'm 13 or older</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
