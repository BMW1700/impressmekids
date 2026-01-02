import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, Users, MapPin, Clock, Calendar, Bell } from "lucide-react";
import { format } from "date-fns";

const StudentClubDetail = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // Fetch club details
  const { data: club, isLoading: clubLoading } = useQuery({
    queryKey: ["student-club-detail", clubId],
    queryFn: async () => {
      if (!clubId) return null;

      const { data, error } = await supabase
        .from("clubs")
        .select("*")
        .eq("id", clubId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!clubId,
  });

  // Fetch profile names for club owner and post authors via security definer function
  const { data: profileNames } = useQuery({
    queryKey: ["club-profile-names", clubId],
    queryFn: async () => {
      if (!clubId) return [];

      const { data, error } = await supabase.rpc("get_club_profile_names", {
        club_id: clubId,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clubId,
  });

  // Helper to get name by profile id
  const getProfileName = (profileId: string | null | undefined): string => {
    if (!profileId || !profileNames) return "Unknown";
    const profile = profileNames.find((p: any) => p.profile_id === profileId);
    return profile?.full_name || "Unknown";
  };

  // Fetch club announcements
  const { data: announcements, isLoading: announcementsLoading } = useQuery({
    queryKey: ["student-club-announcements", clubId],
    queryFn: async () => {
      if (!clubId) return [];

      const { data, error } = await supabase
        .from("club_posts")
        .select("*")
        .eq("club_id", clubId)
        .eq("post_type", "announcement")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clubId,
  });

  const formatMeetingDays = (days: string[] | null | undefined) => {
    if (!days || days.length === 0) return null;
    const dayNames: Record<string, string> = {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
    };
    return days.map(d => dayNames[d] || d).join(", ");
  };

  const formatTime = (time: string | null | undefined) => {
    if (!time) return null;
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (clubLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showAuthButtons={false} onSignOut={signOut} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Club Not Found</h1>
            <p className="text-muted-foreground mb-4">
              This club doesn't exist or you don't have access.
            </p>
            <Button onClick={() => navigate("/student/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showAuthButtons={false} onSignOut={signOut} />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate("/student/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          {/* Club Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{club.name}</h1>
                <p className="text-muted-foreground">
                  Led by {getProfileName(club.owner_id)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Club Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Club Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {club.owner_id && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Club Leader</h4>
                      <p>{getProfileName(club.owner_id)}</p>
                    </div>
                  </div>
                )}

                {club.description ? (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                    <p>{club.description}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No description available</p>
                )}

                {club.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
                      <p>{club.location}</p>
                    </div>
                  </div>
                )}

                {club.meeting_days && club.meeting_days.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Meeting Days</h4>
                      <p>{formatMeetingDays(club.meeting_days)}</p>
                    </div>
                  </div>
                )}

                {club.start_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Meeting Time</h4>
                      <p>
                        {formatTime(club.start_time)}
                        {club.end_time && ` - ${formatTime(club.end_time)}`}
                      </p>
                    </div>
                  </div>
                )}

                {club.schedule_start_date && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Schedule</h4>
                    <p>
                      {format(new Date(club.schedule_start_date), "MMM d, yyyy")}
                      {club.schedule_end_date && ` - ${format(new Date(club.schedule_end_date), "MMM d, yyyy")}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Announcements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {announcementsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : announcements && announcements.length > 0 ? (
                  <div className="space-y-4">
                    {announcements.map((announcement: any) => (
                      <div
                        key={announcement.id}
                        className="p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{announcement.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(announcement.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                        {announcement.content && (
                          <p className="text-sm text-muted-foreground">
                            {announcement.content}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Posted by {getProfileName(announcement.created_by)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No announcements yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StudentClubDetail;
