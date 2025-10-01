import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Users, Calendar } from "lucide-react";

interface ClassroomCardProps {
  id: string;
  name: string;
  joinCode?: string;
  studentCount?: number;
  teacherName?: string;
  createdAt: string;
}

export const ClassroomCard = ({ 
  id, 
  name, 
  joinCode,
  studentCount = 0,
  teacherName,
  createdAt 
}: ClassroomCardProps) => {
  return (
    <Card className="shadow-card hover:shadow-yellow transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{name}</CardTitle>
          {joinCode && (
            <Badge variant="outline" className="font-mono text-sm">
              {joinCode}
            </Badge>
          )}
        </div>
        {teacherName && (
          <CardDescription>Teacher: {teacherName}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{studentCount} students</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <Button asChild className="w-full">
          <Link to={`/classrooms/${id}`}>View Classroom</Link>
        </Button>
      </CardContent>
    </Card>
  );
};
