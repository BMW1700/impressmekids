import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStudentClassroomIds } from "@/hooks/useStudentClassroomIds";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Megaphone, Info, AlertCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface ParentAnnouncementsFeedProps {
  studentId: string;
}

export const ParentAnnouncementsFeed = ({ studentId }: ParentAnnouncementsFeedProps) => {
  // Use shared hook for classroom IDs (cached across components)
  const { data: classroomIds = [], isLoading: classroomsLoading } = useStudentClassroomIds(studentId);

  const { data: announcements, isLoading: announcementsLoading } = useQuery({
    queryKey: ["parent-announcements", studentId, classroomIds],
    queryFn: async () => {
      if (classroomIds.length === 0) return [];

      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const { data, error } = await supabase
        .from("classroom_announcements")
        .select(`
          id,
          title,
          content,
          announcement_type,
          created_at,
          classrooms (
            name
          ),
          profiles:teacher_id (
            full_name
          )
        `)
        .in("classroom_id", classroomIds)
        .gte("created_at", fourteenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(15);

      if (error) throw error;
      return data;
    },
    enabled: classroomIds.length > 0,
    staleTime: 30000,
  });

  const isLoading = classroomsLoading || announcementsLoading;

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case "urgent":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "important":
        return <Megaphone className="h-4 w-4 text-orange-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-primary" />;
    }
  };

  const getAnnouncementBadge = (type: string) => {
    switch (type) {
      case "urgent":
        return <Badge className="bg-red-500/10 text-red-700 border-0 text-xs">Urgent</Badge>;
      case "important":
        return <Badge className="bg-orange-500/10 text-orange-700 border-0 text-xs">Important</Badge>;
      case "info":
        return <Badge className="bg-blue-500/10 text-blue-700 border-0 text-xs">Info</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 bg-card/80 backdrop-blur-sm shadow-[var(--shadow-glass-md)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Megaphone className="h-5 w-5" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse p-4 rounded-lg bg-muted/30">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-full mb-1" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-gradient-to-br from-green-500/[0.04] to-primary/[0.02] backdrop-blur-sm shadow-[var(--shadow-glass-md)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="icon-circle icon-circle-sm icon-circle-green">
            <Megaphone className="h-4 w-4 text-white" />
          </div>
          Class Announcements
          {announcements && announcements.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {announcements.length} recent
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!announcements || announcements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No recent announcements</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {announcements.map((announcement: any) => (
                <div 
                  key={announcement.id}
                  className={`p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors ${
                    announcement.announcement_type === "urgent" 
                      ? "border-l-4 border-l-red-500" 
                      : announcement.announcement_type === "important"
                      ? "border-l-4 border-l-orange-500"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center shadow-sm mt-0.5">
                      {getAnnouncementIcon(announcement.announcement_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{announcement.title}</h4>
                        {getAnnouncementBadge(announcement.announcement_type)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {announcement.content}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
                        <span>{announcement.classrooms?.name}</span>
                        <span>•</span>
                        <span>{announcement.profiles?.full_name}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
