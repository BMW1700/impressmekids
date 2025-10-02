import { ReactNode } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

interface TeacherOnlyButtonProps extends ButtonProps {
  isTeacher: boolean;
  children: ReactNode;
}

export const TeacherOnlyButton = ({ 
  isTeacher, 
  children, 
  onClick,
  ...props 
}: TeacherOnlyButtonProps) => {
  const { toast } = useToast();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isTeacher) {
      e.preventDefault();
      toast({
        title: "Access Denied",
        description: "Only the classroom teacher can perform this action",
        variant: "destructive",
      });
      return;
    }
    onClick?.(e);
  };

  return (
    <Button 
      {...props} 
      onClick={handleClick}
      disabled={!isTeacher || props.disabled}
    >
      {!isTeacher && <Lock className="mr-2 h-4 w-4" />}
      {children}
    </Button>
  );
};
