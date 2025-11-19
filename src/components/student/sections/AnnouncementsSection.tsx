import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { useAnnouncementHistory } from "@/hooks/useAnnouncementHistory";
import { Loader2 } from "lucide-react";

interface AnnouncementsSectionProps {
  studentId: string;
}

export const AnnouncementsSection = ({ studentId }: AnnouncementsSectionProps) => {
  const { data, isLoading } = useAnnouncementHistory(studentId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Announcements</h1>

      {/* Today */}
      {data?.today && data.today.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.today.map((announcement: any) => (
              <AnnouncementCard
                key={announcement.id}
                title={announcement.title}
                content={announcement.content}
                createdAt={announcement.created_at}
                classroomName={announcement.classrooms?.name}
                type={announcement.announcement_type === "assignment" ? "assignment" : "announcement"}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Last 7 Days */}
      {data?.lastSevenDays && data.lastSevenDays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.lastSevenDays.map((announcement: any) => (
              <AnnouncementCard
                key={announcement.id}
                title={announcement.title}
                content={announcement.content}
                createdAt={announcement.created_at}
                classroomName={announcement.classrooms?.name}
                type={announcement.announcement_type === "assignment" ? "assignment" : "announcement"}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Other */}
      {data?.other && data.other.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Older</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.other.map((announcement: any) => (
              <AnnouncementCard
                key={announcement.id}
                title={announcement.title}
                content={announcement.content}
                createdAt={announcement.created_at}
                classroomName={announcement.classrooms?.name}
                type={announcement.announcement_type === "assignment" ? "assignment" : "announcement"}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {!data?.today?.length && !data?.lastSevenDays?.length && !data?.other?.length && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No announcements yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
