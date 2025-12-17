import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { useAnnouncementHistory } from "@/hooks/useAnnouncementHistory";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface AnnouncementsSectionProps {
  studentId: string;
}

export const AnnouncementsSection = ({ studentId }: AnnouncementsSectionProps) => {
  const { t } = useLanguage();
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
      <h1 className="text-3xl font-bold text-foreground">{t("student.announcements.title")}</h1>

      {/* Today */}
      {data?.today && data.today.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("student.announcements.today")}</CardTitle>
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

      {/* Last 14 Days */}
      {data?.lastFourteenDays && data.lastFourteenDays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("student.announcements.last14Days")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.lastFourteenDays.map((announcement: any) => (
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

      {!data?.today?.length && !data?.lastFourteenDays?.length && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">{t("student.announcements.none")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
