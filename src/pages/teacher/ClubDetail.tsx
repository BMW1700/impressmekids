import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useClubDetail,
  useClubMembers,
  useClubJoinRequests,
  useUpdateClub,
} from "@/hooks/useTeacherClubs";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Loader2,
  Settings,
  Users,
  Bell,
  Check,
  X,
  UserPlus,
  Save,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";

const ClubDetail = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const { data: club, isLoading: clubLoading } = useClubDetail(clubId);
  const { data: members, isLoading: membersLoading } = useClubMembers(clubId);
  const {
    requests,
    isLoading: requestsLoading,
    approveRequest,
    denyRequest,
    isApproving,
    isDenying,
  } = useClubJoinRequests(clubId);
  const updateClub = useUpdateClub();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Fetch announcements
  const { data: announcements, isLoading: announcementsLoading } = useQuery({
    queryKey: ["club-announcements", clubId],
    queryFn: async () => {
      if (!clubId) return [];

      const { data, error } = await supabase
        .from("club_posts")
        .select(`
          *,
          profiles:created_by (full_name)
        `)
        .eq("club_id", clubId)
        .eq("post_type", "announcement")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clubId,
  });

  // Settings form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [meetingDays, setMeetingDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Announcement state
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    if (club) {
      setName(club.name || "");
      setDescription(club.description || "");
      setLocation(club.location || "");
      setMeetingDays(club.meeting_days || []);
      setStartTime(club.start_time || "");
      setEndTime(club.end_time || "");
    }
  }, [club]);

  const daysOfWeek = [
    { value: "monday", label: "Mon" },
    { value: "tuesday", label: "Tue" },
    { value: "wednesday", label: "Wed" },
    { value: "thursday", label: "Thu" },
    { value: "friday", label: "Fri" },
    { value: "saturday", label: "Sat" },
    { value: "sunday", label: "Sun" },
  ];

  const toggleMeetingDay = (day: string) => {
    setMeetingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSaveSettings = async () => {
    if (!clubId) return;

    updateClub.mutate({
      clubId,
      updates: {
        name: name.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        meeting_days: meetingDays.length > 0 ? meetingDays : undefined,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
      },
    });
  };

  const handlePostAnnouncement = async () => {
    if (!clubId || !announcementTitle.trim()) {
      toast({
        title: "Error",
        description: "Announcement title is required",
        variant: "destructive",
      });
      return;
    }

    setIsPostingAnnouncement(true);

    try {
      const { error } = await supabase.from("club_posts").insert({
        club_id: clubId,
        title: announcementTitle.trim(),
        content: announcementContent.trim() || null,
        post_type: "announcement",
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Announcement posted successfully!",
      });

      setAnnouncementTitle("");
      setAnnouncementContent("");
      queryClient.invalidateQueries({ queryKey: ["club-announcements", clubId] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post announcement",
        variant: "destructive",
      });
    } finally {
      setIsPostingAnnouncement(false);
    }
  };

  const handleStartEdit = (announcement: any) => {
    setEditingAnnouncementId(announcement.id);
    setEditingTitle(announcement.title);
    setEditingContent(announcement.content || "");
  };

  const handleCancelEdit = () => {
    setEditingAnnouncementId(null);
    setEditingTitle("");
    setEditingContent("");
  };

  const handleSaveEdit = async () => {
    if (!editingAnnouncementId || !editingTitle.trim()) {
      toast({
        title: "Error",
        description: "Announcement title is required",
        variant: "destructive",
      });
      return;
    }

    setIsSavingEdit(true);

    try {
      const { error } = await supabase
        .from("club_posts")
        .update({
          title: editingTitle.trim(),
          content: editingContent.trim() || null,
        })
        .eq("id", editingAnnouncementId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Announcement updated successfully!",
      });

      setEditingAnnouncementId(null);
      setEditingTitle("");
      setEditingContent("");
      queryClient.invalidateQueries({ queryKey: ["club-announcements", clubId] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update announcement",
        variant: "destructive",
      });
    } finally {
      setIsSavingEdit(false);
    }
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
            <Button onClick={() => navigate("/teacher/dashboard")}>
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
            onClick={() => navigate("/teacher/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="mb-6">
            <h1 className="text-3xl font-bold">{club.name}</h1>
            {club.description && (
              <p className="text-muted-foreground mt-1">{club.description}</p>
            )}
          </div>

          <Tabs defaultValue="settings" className="space-y-6">
            {isMobile ? (
              <div className="flex flex-col gap-1">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </TabsTrigger>
                  <TabsTrigger value="requests">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Requests
                    {requests.length > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {requests.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="announcements">
                    <Bell className="h-4 w-4 mr-2" />
                    Announcements
                  </TabsTrigger>
                  <TabsTrigger value="roster">
                    <Users className="h-4 w-4 mr-2" />
                    Roster ({members?.length || 0})
                  </TabsTrigger>
                </TabsList>
              </div>
            ) : (
              <TabsList>
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
                <TabsTrigger value="announcements">
                  <Bell className="h-4 w-4 mr-2" />
                  Announcements
                </TabsTrigger>
                <TabsTrigger value="roster">
                  <Users className="h-4 w-4 mr-2" />
                  Roster ({members?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="requests">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Requests
                  {requests.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {requests.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            )}

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Club Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="editClubName">Club Name</Label>
                    <Input
                      id="editClubName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="editDescription">Description</Label>
                    <Textarea
                      id="editDescription"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your club..."
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="editLocation">Room/Location</Label>
                    <Input
                      id="editLocation"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Room 105"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Meeting Days</Label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          variant={meetingDays.includes(day.value) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleMeetingDay(day.value)}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="editStartTime">Start Time</Label>
                      <Input
                        id="editStartTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="editEndTime">End Time</Label>
                      <Input
                        id="editEndTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveSettings}
                    disabled={updateClub.isPending}
                  >
                    {updateClub.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="announcements">
              <Card>
                <CardHeader>
                  <CardTitle>Post Announcement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="announcementTitle">Title</Label>
                    <Input
                      id="announcementTitle"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      placeholder="Announcement title..."
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="announcementContent">Content</Label>
                    <Textarea
                      id="announcementContent"
                      value={announcementContent}
                      onChange={(e) => setAnnouncementContent(e.target.value)}
                      placeholder="Write your announcement..."
                      rows={4}
                    />
                  </div>

                  <Button
                    onClick={handlePostAnnouncement}
                    disabled={isPostingAnnouncement}
                  >
                    {isPostingAnnouncement ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Bell className="h-4 w-4 mr-2" />
                    )}
                    Post Announcement
                  </Button>
                </CardContent>
              </Card>

              {/* Posted Announcements */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Posted Announcements</CardTitle>
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
                          {editingAnnouncementId === announcement.id ? (
                            <div className="space-y-3">
                              <Input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                placeholder="Announcement title..."
                              />
                              <Textarea
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                placeholder="Announcement content..."
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  disabled={isSavingEdit}
                                >
                                  {isSavingEdit ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <Save className="h-4 w-4 mr-1" />
                                  )}
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  disabled={isSavingEdit}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold">{announcement.title}</h4>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleStartEdit(announcement)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(announcement.created_at), "MMM d, yyyy 'at' h:mm a")}
                                  </span>
                                </div>
                              </div>
                              {announcement.content && (
                                <p className="text-sm text-muted-foreground">
                                  {announcement.content}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No announcements posted yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roster">
              <Card>
                <CardHeader>
                  <CardTitle>Club Members</CardTitle>
                </CardHeader>
                <CardContent>
                  {membersLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : members && members.length > 0 ? (
                    <div className="space-y-3">
                      {members.map((member: any) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {member.profiles?.full_name || "Unknown"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.profiles?.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{member.role}</Badge>
                            <span className="text-xs text-muted-foreground">
                              Joined {format(new Date(member.joined_at), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No members yet</p>
                      <p className="text-sm">
                        Students can request to join from the Browse Clubs page
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Join Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {requestsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : requests.length > 0 ? (
                    <div className="space-y-3">
                      {requests.map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{request.student_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {request.student_email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Requested {format(new Date(request.requested_at), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveRequest(request.id)}
                              disabled={isApproving || isDenying}
                            >
                              {isApproving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => denyRequest(request.id)}
                              disabled={isApproving || isDenying}
                            >
                              {isDenying ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No pending requests</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ClubDetail;
