import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Building } from "lucide-react";

interface TeacherListCardProps {
  teacher: {
    id: string;
    full_name: string;
    email: string;
    classroom_count: number;
    school_id?: string | null;
    school_name?: string | null;
  };
  onViewClassrooms: (teacherId: string, teacherName: string) => void;
  onConnectToSchool?: (userId: string, userName: string, currentSchoolId?: string | null) => void;
}

export const TeacherListCard = ({ teacher, onViewClassrooms, onConnectToSchool }: TeacherListCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{teacher.full_name}</CardTitle>
        <CardDescription>{teacher.email}</CardDescription>
        {teacher.school_name && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Building className="h-3 w-3" />
            {teacher.school_name}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge className="gap-1 bg-blue-500 text-white">
            <Users className="h-3 w-3" />
            {teacher.classroom_count} {teacher.classroom_count === 1 ? "Classroom" : "Classrooms"}
          </Badge>
          <Button 
            size="sm" 
            className="bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => onViewClassrooms(teacher.id, teacher.full_name)}
          >
            View Classrooms
          </Button>
        </div>
        {onConnectToSchool && (
          <Button 
            size="sm" 
            variant="outline"
            className="w-full"
            onClick={() => onConnectToSchool(teacher.id, teacher.full_name, teacher.school_id)}
          >
            <Building className="h-3 w-3 mr-1" />
            {teacher.school_id ? "Change School" : "Connect to School"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
