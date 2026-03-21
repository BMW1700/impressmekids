import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, Heart } from "lucide-react";

interface RoleSelectionModalProps {
  open: boolean;
  districtName: string;
  availableRoles: ('teacher' | 'student' | 'parent')[];
  onSelectRole: (role: 'teacher' | 'student' | 'parent') => void;
}

export function RoleSelectionModal({ open, districtName, availableRoles, onSelectRole }: RoleSelectionModalProps) {
  const roleConfig = {
    teacher: { icon: Users, label: 'Teacher' },
    student: { icon: GraduationCap, label: 'Student' },
    parent: { icon: Heart, label: 'Parent' },
  };

  const title = districtName 
    ? `Welcome to ${districtName}!`
    : 'Welcome to NabuLearn!';
  
  const description = availableRoles.length === 2 && districtName
    ? 'Are you joining as a teacher or student?'
    : 'How are you joining us today?';

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className={`grid gap-4 pt-4 ${availableRoles.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {availableRoles.map((role) => {
            const { icon: Icon, label } = roleConfig[role];
            return (
              <Button
                key={role}
                variant="outline"
                className="h-32 flex-col gap-3 hover:bg-primary/10 hover:border-primary transition-all"
                onClick={() => onSelectRole(role)}
              >
                <Icon className="h-10 w-10 text-primary" />
                <span className="text-base font-semibold">{label}</span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
