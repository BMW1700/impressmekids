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
    <Card variant="glass" className="hover-lift group min-w-[320px] h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <CardTitle className="text-xl font-black text-gradient-purple">{name}</CardTitle>
          {joinCode && (
            <Badge variant="purple" className="font-mono text-xs px-2 py-1 shrink-0">
              {joinCode}
            </Badge>
          )}
        </div>
        {teacherName && (
          <CardDescription className="text-base">👨‍🏫 {teacherName}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass-card">
            <div className="icon-circle-blue w-7 h-7 flex items-center justify-center">
              <Users className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold">{studentCount}</span>
            <span className="text-muted-foreground">students</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass-card">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">{new Date(createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="mt-auto">
          <Button asChild variant="gradient" className="w-full shadow-glow-purple group-hover:shadow-glow-purple-lg">
            <Link to={`/classrooms/${id}`} className="flex items-center justify-center gap-2">
              View Classroom
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
