import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Bell } from "lucide-react";
import { useStudentClubs } from "@/hooks/useStudentClubs";
import { Loader2 } from "lucide-react";

interface ClubsSectionProps {
  studentId: string;
}

export const ClubsSection = ({ studentId }: ClubsSectionProps) => {
  const { data: clubs, isLoading } = useStudentClubs(studentId);

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
        <h1 className="text-3xl font-bold text-foreground">Clubs & Organizations</h1>
        <Button>Create Club</Button>
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
                  {club.userRole === "owner" && (
                    <Badge variant="secondary">Owner</Badge>
                  )}
                  {club.userRole === "moderator" && (
                    <Badge variant="secondary">Moderator</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {club.description && (
                  <p className="text-sm text-muted-foreground">{club.description}</p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Bell className="h-4 w-4 mr-2" />
                    View Posts
                  </Button>
                  {(club.userRole === "owner" || club.userRole === "moderator") && (
                    <Button size="sm" className="flex-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      New Post
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
            <p className="text-muted-foreground mb-4">
              You're not a member of any clubs yet.
            </p>
            <Button>Browse Clubs</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
