import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, FileText } from "lucide-react";

interface AnnouncementCardProps {
  title: string;
  content: string;
  type: "announcement" | "assignment";
  createdAt: string;
  classroomName?: string;
}

export const AnnouncementCard = ({ 
  title, 
  content, 
  type, 
  createdAt,
  classroomName 
}: AnnouncementCardProps) => {
  return (
    <Card className="shadow-card hover:shadow-yellow transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            {type === "assignment" ? (
              <FileText className="h-5 w-5 text-primary" />
            ) : (
              <Bell className="h-5 w-5 text-primary" />
            )}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge variant={type === "assignment" ? "default" : "secondary"}>
            {type === "assignment" ? "Assignment" : "Announcement"}
          </Badge>
        </div>
        {classroomName && (
          <CardDescription>From: {classroomName}</CardDescription>
        )}
        <CardDescription>
          {new Date(createdAt).toLocaleDateString()} at {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{content}</p>
      </CardContent>
    </Card>
  );
};
