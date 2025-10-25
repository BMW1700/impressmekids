import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useStudentClassrooms } from "@/hooks/useAdminData";
import { format } from "date-fns";

interface StudentClassroomsListProps {
  open: boolean;
  onClose: () => void;
  studentId: string | null;
  studentName: string;
}

export const StudentClassroomsList = ({
  open,
  onClose,
  studentId,
  studentName,
}: StudentClassroomsListProps) => {
  const { data: classrooms, isLoading } = useStudentClassrooms(studentId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{studentName}'s Classrooms</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !classrooms || classrooms.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Not enrolled in any classrooms</p>
        ) : (
          <div className="space-y-3">
            {classrooms.map((classroom) => (
              <Card key={classroom.classroom_id}>
                <CardHeader>
                  <CardTitle className="text-base">{classroom.classroom_name}</CardTitle>
                  <CardDescription>
                    Teacher: {classroom.teacher_name} • Code: {classroom.join_code}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Joined: {format(new Date(classroom.joined_at), "MMM d, yyyy")}
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
