import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, User } from "lucide-react";

interface StudentClassroomCardProps {
  classroomName: string;
  teacherName: string;
  currentGrade: number | null;
  assignmentCount: number;
  gradedAssignmentCount: number;
}

export const StudentClassroomCard = ({
  classroomName,
  teacherName,
  currentGrade,
  assignmentCount,
  gradedAssignmentCount,
}: StudentClassroomCardProps) => {
  const getGradeBadgeVariant = (grade: number | null) => {
    if (grade === null) return "secondary";
    if (grade >= 80) return "default";
    if (grade >= 60) return "secondary";
    return "destructive";
  };

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return "text-muted-foreground";
    if (grade >= 80) return "text-green-600 dark:text-green-400";
    if (grade >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{classroomName}</h4>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span className="truncate">{teacherName}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {gradedAssignmentCount} of {assignmentCount} assignments graded
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            {currentGrade !== null ? (
              <Badge 
                variant={getGradeBadgeVariant(currentGrade)}
                className={`${getGradeColor(currentGrade)} font-semibold`}
              >
                {Math.round(currentGrade)}%
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-muted-foreground">
                No grades
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
