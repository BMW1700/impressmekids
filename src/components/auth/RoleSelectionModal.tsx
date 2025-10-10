import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users } from "lucide-react";

interface RoleSelectionModalProps {
  open: boolean;
  districtName: string;
  onSelectRole: (role: 'teacher' | 'student') => void;
}

export function RoleSelectionModal({ open, districtName, onSelectRole }: RoleSelectionModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to {districtName}!</DialogTitle>
          <DialogDescription>
            Are you joining as a teacher or student?
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 pt-4">
          <Button
            variant="outline"
            className="h-32 flex-col gap-3 hover:bg-primary/10 hover:border-primary transition-all"
            onClick={() => onSelectRole('teacher')}
          >
            <Users className="h-10 w-10 text-primary" />
            <span className="text-base font-semibold">Teacher</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-32 flex-col gap-3 hover:bg-primary/10 hover:border-primary transition-all"
            onClick={() => onSelectRole('student')}
          >
            <GraduationCap className="h-10 w-10 text-primary" />
            <span className="text-base font-semibold">Student</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
