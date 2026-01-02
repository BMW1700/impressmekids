import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Bell, Plus, Search } from "lucide-react";
import { useStudentClubs } from "@/hooks/useStudentClubs";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateClubPostModal } from "@/components/student/CreateClubPostModal";
import { useLanguage } from "@/contexts/LanguageContext";

interface ClubsSectionProps {
  studentId: string;
}

export const ClubsSection = ({ studentId }: ClubsSectionProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: clubs, isLoading, refetch } = useStudentClubs(studentId);
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">{t("student.clubs.title")}</h1>
        <Button onClick={() => navigate("/student/browse-clubs")}>
          <Search className="h-4 w-4 mr-2" />
          {t("student.clubs.browseClubs")}
        </Button>
      </div>

      {clubs && clubs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club: any) => (
            <Card key={club.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{club.name}</CardTitle>
                  </div>
                  {club.userRole === "owner" && <Badge variant="secondary">{t("student.clubs.owner")}</Badge>}
                  {club.userRole === "moderator" && (
                    <Badge variant="secondary">{t("student.clubs.moderator")}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {club.description && <p className="text-sm text-muted-foreground">{club.description}</p>}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Bell className="h-4 w-4 mr-2" />
                    {t("student.clubs.viewPosts")}
                  </Button>
                  {(club.userRole === "owner" || club.userRole === "moderator") && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedClub(club.id);
                        setShowPostModal(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("student.clubs.newPost")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{t("student.clubs.none")}</p>
            <Button onClick={() => navigate("/student/browse-clubs")}>
              <Search className="h-4 w-4 mr-2" />
              {t("student.clubs.browseClubs")}
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedClub && (
        <CreateClubPostModal
          open={showPostModal}
          onOpenChange={setShowPostModal}
          clubId={selectedClub}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
};
