import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Student {
  id: string;
  full_name: string;
  email: string;
  joined_at: string;
}

interface ClassroomWithStudents {
  id: string;
  name: string;
  subject: string;
  grade: number;
  students: Student[];
}

interface AllStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classrooms: ClassroomWithStudents[];
  totalStudents: number;
}

export function AllStudentsDialog({ 
  open, 
  onOpenChange, 
  classrooms,
  totalStudents 
}: AllStudentsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Users className="h-6 w-6 text-primary" />
            All Students Roster
            <Badge variant="secondary" className="ml-2">
              {totalStudents} Total
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {classrooms.map((classroom) => (
              <Card key={classroom.id} className="border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold">
                        {classroom.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {classroom.subject} • Grade {classroom.grade}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-sm">
                      {classroom.students.length} {classroom.students.length === 1 ? 'Student' : 'Students'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {classroom.students.length === 0 ? (
                    <p className="text-muted-foreground text-sm italic">
                      No students enrolled yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {classroom.students.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{student.full_name}</h4>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {student.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Joined {format(new Date(student.joined_at), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {classrooms.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No classrooms created yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
