import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Users, Calendar, ChevronRight } from "lucide-react";

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
    <Card variant="glass" className="hover-lift group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-2xl font-black text-gradient-purple">{name}</CardTitle>
          {joinCode && (
            <Badge variant="purple" className="font-mono text-sm px-3 py-1.5">
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
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass-card">
            <div className="icon-circle-blue w-8 h-8">
              <Users className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold">{studentCount}</span>
            <span className="text-muted-foreground">students</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass-card">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">{new Date(createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <Button asChild variant="gradient" className="w-full shadow-glow-purple group-hover:shadow-glow-purple-lg">
          <Link to={`/classrooms/${id}`} className="flex items-center justify-center gap-2">
            View Classroom
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
