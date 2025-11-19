import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useStudentAssignmentStats } from "@/hooks/useStudentAssignmentStats";
import { StudentDashboardSidebar } from "@/components/student/StudentDashboardSidebar";
import { HomeSection } from "@/components/student/sections/HomeSection";
import { TodaySection } from "@/components/student/sections/TodaySection";
import { CoursesSection } from "@/components/student/sections/CoursesSection";
import { ClubsSection } from "@/components/student/sections/ClubsSection";
import { CalendarSection } from "@/components/student/sections/CalendarSection";
import { AnnouncementsSection } from "@/components/student/sections/AnnouncementsSection";
import { GradebookSection } from "@/components/student/sections/GradebookSection";
import { DirectorySection } from "@/components/student/sections/DirectorySection";
import { AccountSection } from "@/components/student/sections/AccountSection";

const StudentDashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("home");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: assignmentStats } = useStudentAssignmentStats(profile?.id);

  useEffect(() => {
    checkAuth();
    loadDashboardData();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth'); return; }

      const { data: profileResult, error: profileError } = await supabase.rpc('get_user_profile', { _user_id: session.user.id });
      if (profileError || !profileResult || profileResult.length === 0) { navigate('/auth'); return; }

      const profileData = profileResult[0];
      if (profileData.role === 'teacher') { navigate('/teacher/dashboard'); return; }

      setProfile(profileData);

      const { data: publicProfile } = await supabase.from('public_profiles').select('*').eq('id', session.user.id).single();
      const { data: studentData } = await supabase.from('student_profiles').select('stats').eq('user_id', session.user.id).single();

      if (!studentData) {
        const { data: newProfile } = await supabase.from('student_profiles').insert({ user_id: session.user.id, stats: { games_played: 0, games_won: 0 } }).select().single();
        setStudentProfile({ ...publicProfile, stats: newProfile?.stats });
      } else {
        setStudentProfile({ ...publicProfile, stats: studentData.stats });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load profile", variant: "destructive" });
    }
  };

  const loadDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: classroomsData } = await supabase.rpc('get_student_classrooms', { _user_id: session.user.id });
      if (classroomsData) setClassrooms(classroomsData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const renderSection = () => {
    if (!profile) return null;
    switch (activeSection) {
      case "home": return <HomeSection userProfile={profile} studentProfile={studentProfile} assignmentStats={assignmentStats} />;
      case "today": return <TodaySection studentId={profile.id} />;
      case "courses": return <CoursesSection classrooms={classrooms} />;
      case "clubs": return <ClubsSection studentId={profile.id} />;
      case "calendar": return <CalendarSection studentId={profile.id} />;
      case "announcements": return <AnnouncementsSection studentId={profile.id} />;
      case "gradebook": return <GradebookSection studentId={profile.id} />;
      case "directory": return <DirectorySection />;
      case "account": return <AccountSection userProfile={profile} studentProfile={studentProfile} />;
      default: return <HomeSection userProfile={profile} studentProfile={studentProfile} assignmentStats={assignmentStats} />;
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSignOut={handleSignOut} />
      <div className="flex flex-1">
        <StudentDashboardSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">{renderSection()}</div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default StudentDashboard;
