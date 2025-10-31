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
    <Card className="shadow-card hover:shadow-yellow transition-all duration-300 hover:scale-[1.02] border-2 border-primary/10 hover:border-primary/30 bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">{name}</CardTitle>
          {joinCode && (
            <Badge variant="outline" className="font-mono text-sm px-3 py-1.5 border-primary/30">
              {joinCode}
            </Badge>
          )}
        </div>
        {teacherName && (
          <CardDescription className="text-base">👨‍🏫 {teacherName}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-semibold">{studentCount}</span>
            <span className="text-muted-foreground">students</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">{new Date(createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <Button asChild className="w-full bg-gradient-primary hover:opacity-90 shadow-card text-base py-5">
          <Link to={`/classrooms/${id}`}>View Classroom →</Link>
        </Button>
      </CardContent>
    </Card>
  );
};
