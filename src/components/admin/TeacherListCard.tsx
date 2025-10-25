import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface TeacherListCardProps {
  teacher: {
    id: string;
    full_name: string;
    email: string;
    classroom_count: number;
  };
  onViewClassrooms: (teacherId: string, teacherName: string) => void;
}

export const TeacherListCard = ({ teacher, onViewClassrooms }: TeacherListCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{teacher.full_name}</CardTitle>
        <CardDescription>{teacher.email}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <Badge variant="secondary" className="gap-1">
          <Users className="h-3 w-3" />
          {teacher.classroom_count} {teacher.classroom_count === 1 ? "Classroom" : "Classrooms"}
        </Badge>
        <Button 
          size="sm" 
          onClick={() => onViewClassrooms(teacher.id, teacher.full_name)}
        >
          View Classrooms
        </Button>
      </CardContent>
    </Card>
  );
};
