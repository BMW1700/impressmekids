import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { School, Users } from "lucide-react";

interface StudentListCardProps {
  student: {
    id: string;
    full_name: string;
    email: string;
    classroom_count: number;
    parent_count: number;
  };
  onViewClassrooms: (studentId: string, studentName: string) => void;
  onViewParents: (studentId: string, studentName: string) => void;
}

export const StudentListCard = ({ student, onViewClassrooms, onViewParents }: StudentListCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{student.full_name}</CardTitle>
        <CardDescription>{student.email}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Badge className="gap-1 bg-emerald-500 text-white">
            <School className="h-3 w-3" />
            {student.classroom_count} {student.classroom_count === 1 ? "Classroom" : "Classrooms"}
          </Badge>
          <Badge className="gap-1 bg-emerald-500 text-white">
            <Users className="h-3 w-3" />
            {student.parent_count} {student.parent_count === 1 ? "Parent" : "Parents"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={() => onViewClassrooms(student.id, student.full_name)}
          >
            View Classrooms
          </Button>
          <Button 
            size="sm" 
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={() => onViewParents(student.id, student.full_name)}
          >
            View Parents
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
