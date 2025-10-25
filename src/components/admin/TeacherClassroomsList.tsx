import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2 } from "lucide-react";
import { useTeacherClassrooms } from "@/hooks/useAdminData";

interface TeacherClassroomsListProps {
  open: boolean;
  onClose: () => void;
  teacherId: string | null;
  teacherName: string;
  onViewStudents: (classroomId: string, classroomName: string) => void;
}

export const TeacherClassroomsList = ({
  open,
  onClose,
  teacherId,
  teacherName,
  onViewStudents,
}: TeacherClassroomsListProps) => {
  const { data: classrooms, isLoading } = useTeacherClassrooms(teacherId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{teacherName}'s Classrooms</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !classrooms || classrooms.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No classrooms found</p>
        ) : (
          <div className="space-y-3">
            {classrooms.map((classroom) => (
              <Card key={classroom.id}>
                <CardHeader>
                  <CardTitle className="text-base">{classroom.name}</CardTitle>
                  <CardDescription>Join Code: {classroom.join_code}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {classroom.student_count} {classroom.student_count === 1 ? "Student" : "Students"}
                  </Badge>
                  <Button 
                    size="sm" 
                    onClick={() => onViewStudents(classroom.id, classroom.name)}
                  >
                    View Students
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
