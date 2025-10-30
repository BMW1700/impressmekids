import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProfileCard } from "@/components/ProfileCard";
import { ClassroomCard } from "@/components/ClassroomCard";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Gamepad2, Loader2, UserPlus, Bell, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import NextBestActionCard from "@/components/aura/NextBestActionCard";
import { CalendarWidget } from "@/components/calendar/CalendarWidget";

const StudentDashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadDashboardData();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔍 StudentDashboard: Checking authentication...');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('❌ No session found, redirecting to auth');
        navigate('/auth');
        return;
      }

      console.log('✅ Session found:', session.user.id);

      // Fetch user profile using security definer function
      const { data: profileResult, error: profileError } = await supabase
        .rpc('get_user_profile', { _user_id: session.user.id });

      if (profileError) {
        console.error('❌ Failed to fetch profile:', profileError);
        navigate('/auth');
        return;
      }

      if (!profileResult || profileResult.length === 0) {
        console.log('❌ No profile found');
        navigate('/auth');
        return;
      }

      const profileData = profileResult[0];
      console.log('✅ Profile found:', { id: profileData.id, role: profileData.role });

      if (profileData.role === 'teacher') {
        console.log(`⚠️ User role is teacher. Redirecting to teacher dashboard`);
        navigate('/teacher/dashboard');
        return;
      }

      console.log('✅ Student access confirmed');
      setProfile(profileData);

      // Get public profile (display-safe info only)
      const { data: publicProfile } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      // Get student stats from student_profiles
      const { data: studentData } = await supabase
        .from('student_profiles')
        .select('stats')
        .eq('user_id', session.user.id)
        .single();

      if (!studentData) {
        console.log('📝 Creating new student profile...');
        const { data: newProfile } = await supabase
          .from('student_profiles')
          .insert({ user_id: session.user.id, stats: { games_played: 0, games_won: 0 } })
          .select()
          .single();
        setStudentProfile({ ...publicProfile, stats: newProfile?.stats });
        console.log('✅ Student profile created');
      } else {
        console.log('✅ Student profile found');
        setStudentProfile({ ...publicProfile, stats: studentData.stats });
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      navigate('/auth');
    }
  };

  const loadDashboardData = async () => {
    try {
      console.log('📊 StudentDashboard: Loading dashboard data...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('❌ No session found');
        return;
      }

      console.log('🔍 Fetching classrooms for user:', session.user.id);
      
      // Fetch classrooms using security definer function to bypass RLS
      const { data: classroomsData, error } = await supabase
        .rpc('get_student_classrooms', { _user_id: session.user.id });

      console.log('📚 Classrooms RPC result:', { data: classroomsData, error });

      if (error) {
        console.error('❌ Error loading classrooms:', error);
        throw error;
      }
      
      // Transform data to match ClassroomCard props format
      const classroomsList = classroomsData?.map((classroom: any) => ({
        id: classroom.id,
        name: classroom.name,
        joinCode: classroom.join_code,
        createdAt: classroom.created_at,
        teacherName: classroom.teacher_name,
        studentCount: Number(classroom.student_count) || 0
      })) || [];
      
      console.log('✅ Transformed classrooms:', classroomsList);
      setClassrooms(classroomsList);

      // Load announcements from all classrooms
      if (classroomsList.length > 0) {
        console.log('📢 Loading announcements for', classroomsList.length, 'classrooms');
        const classroomIds = classroomsList.map((c: any) => c.id);
        const { data: announcementsData } = await supabase
          .from('classroom_announcements')
          .select('*, classrooms(name)')
          .in('classroom_id', classroomIds)
          .order('created_at', { ascending: false })
          .limit(10);

        console.log('✅ Loaded announcements:', announcementsData?.length || 0);
        setAnnouncements(announcementsData || []);
      } else {
        console.log('ℹ️ No classrooms to load announcements for');
      }
    } catch (error: any) {
      console.error('❌ Fatal error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuthButtons={false} onSignOut={handleSignOut} />
      
      <main className="flex-1 py-8 animate-fade-in">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Hey {profile?.full_name}! 🎮
            </h1>
            <p className="text-muted-foreground">Ready to play and learn?</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1">
              <ProfileCard
                fullName={studentProfile?.display_name || profile?.full_name}
                grade={studentProfile?.grade}
                avatarUrl={studentProfile?.avatar_url}
                stats={studentProfile?.stats}
              />
            </div>
            
            <div className="lg:col-span-2 space-y-6">
              {/* Calendar Widget */}
              {profile && (
                <CalendarWidget 
                  userId={profile.id} 
                  userRole="student"
                />
              )}
              
              {/* AI Next Best Action - Phase 5 Integration */}
              <NextBestActionCard />

              <Card className="bg-gradient-hero text-white">
                <CardHeader>
                  <CardTitle className="text-2xl">Ready to Play?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Challenge your friends and show off your knowledge!
                  </p>
                  <Button 
                    className="bg-secondary text-secondary-foreground hover:bg-secondary-light"
                    onClick={() => navigate('/games')}
                  >
                    <Gamepad2 className="mr-2 h-4 w-4" />
                    Browse Games
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <CardHeader>
                  <CardTitle className="text-2xl">Practice Speaking with AURA</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Improve your pronunciation and speaking skills with AI-powered feedback!
                  </p>
                  <Button 
                    className="bg-white text-purple-600 hover:bg-gray-100"
                    onClick={() => navigate('/student/aura-practice')}
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    Start Practicing
                  </Button>
                </CardContent>
              </Card>

              {announcements.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" />
                      <CardTitle>Recent Announcements</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {announcements.slice(0, 3).map((announcement: any) => (
                        <AnnouncementCard
                          key={announcement.id}
                          title={announcement.title}
                          content={announcement.content}
                          type={announcement.announcement_type}
                          createdAt={announcement.created_at}
                          classroomName={announcement.classrooms?.name}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">My Classrooms</h2>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/join-class')}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Join Classroom
                  </Button>
                </div>
                {classrooms.length === 0 ? (
                  <Card className="p-8 text-center">
                    <div className="h-24 w-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                      <UserPlus className="h-12 w-12 text-white" />
                    </div>
                    <p className="text-muted-foreground mb-4">
                      You haven't joined any classrooms yet. Ask your teacher for a join code!
                    </p>
                    <Button 
                      onClick={() => navigate('/join-class')}
                      className="bg-gradient-primary hover:opacity-90"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Join a Classroom
                    </Button>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {classrooms.map((classroom: any) => (
                      <div key={classroom.id} className="hover:scale-[1.02] transition-transform duration-200">
                        <ClassroomCard
                          id={classroom.id}
                          name={classroom.name}
                          joinCode={classroom.joinCode}
                          teacherName={classroom.teacherName}
                          studentCount={classroom.studentCount}
                          createdAt={classroom.createdAt}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StudentDashboard;
