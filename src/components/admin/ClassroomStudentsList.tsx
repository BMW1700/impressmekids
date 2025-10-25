import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useClassroomStudents } from "@/hooks/useAdminData";
import { format } from "date-fns";

interface ClassroomStudentsListProps {
  open: boolean;
  onClose: () => void;
  classroomId: string | null;
  classroomName: string;
}

export const ClassroomStudentsList = ({
  open,
  onClose,
  classroomId,
  classroomName,
}: ClassroomStudentsListProps) => {
  const { data: students, isLoading } = useClassroomStudents(classroomId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Students in {classroomName}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !students || students.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No students enrolled</p>
        ) : (
          <div className="space-y-3">
            {students.map((student) => (
              <Card key={student.student_id}>
                <CardHeader>
                  <CardTitle className="text-base">{student.full_name}</CardTitle>
                  <CardDescription>{student.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Joined: {format(new Date(student.joined_at), "MMM d, yyyy")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
