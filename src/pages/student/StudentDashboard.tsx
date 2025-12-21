import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Menu } from "lucide-react";
import { useStudentAssignmentStats } from "@/hooks/useStudentAssignmentStats";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { StudentDashboardSidebar } from "@/components/student/StudentDashboardSidebar";
import { HomeSection } from "@/components/student/sections/HomeSection";
import { TodaySection } from "@/components/student/sections/TodaySection";
import { CoursesSection } from "@/components/student/sections/CoursesSection";
import { ClubsSection } from "@/components/student/sections/ClubsSection";
import { CalendarSection } from "@/components/student/sections/CalendarSection";
import { AnnouncementsSection } from "@/components/student/sections/AnnouncementsSection";
import { GradebookSection } from "@/components/student/sections/GradebookSection";
import { GamesSection } from "@/components/student/sections/GamesSection";
import { DirectorySection } from "@/components/student/sections/DirectorySection";
import { AccountSection } from "@/components/student/sections/AccountSection";
import { SafetySection } from "@/components/student/sections/SafetySection";
import { SafetyAlertBanner } from "@/components/safety/SafetyAlertBanner";
import { DrillAlertOverlay } from "@/components/student/DrillAlertOverlay";

const StudentDashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("home");
  const [tabletSidebarOpen, setTabletSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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
      
      // Redirect non-students to their appropriate dashboards
      if (profileData.role === 'district_manager') { navigate('/district-manager/dashboard'); return; }
      if (profileData.role === 'teacher') { navigate('/teacher/dashboard'); return; }
      if (profileData.role === 'admin') { navigate('/admin/dashboard'); return; }
      if (profileData.role === 'parent') { navigate('/parent/dashboard'); return; }

      // Check verification status (students must be verified to access dashboard)
      const { data: profileDetails } = await supabase
        .from('profiles')
        .select('is_verified')
        .eq('id', session.user.id)
        .single();

      if (!profileDetails?.is_verified) {
        navigate('/pending-verification');
        return;
      }

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
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log('Sign out error (expected if session expired):', error);
    } finally {
      navigate('/auth', { replace: true });
    }
  };

  const renderSection = () => {
    if (!profile) return null;
    switch (activeSection) {
      case "home": return <HomeSection userProfile={profile} studentProfile={studentProfile} assignmentStats={assignmentStats} classrooms={classrooms} />;
      case "today": return <TodaySection studentId={profile.id} />;
      case "courses": return <CoursesSection classrooms={classrooms} />;
      case "clubs": return <ClubsSection studentId={profile.id} />;
      case "calendar": return <CalendarSection studentId={profile.id} />;
      case "announcements": return <AnnouncementsSection studentId={profile.id} />;
      case "study-games": return <GamesSection />;
      case "safety": return <SafetySection />;
      case "gradebook": return <GradebookSection studentId={profile.id} />;
      case "directory": return <DirectorySection />;
      case "account": return <AccountSection userProfile={profile} studentProfile={studentProfile} />;
      default: return <HomeSection userProfile={profile} studentProfile={studentProfile} assignmentStats={assignmentStats} />;
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Full-screen drill alert overlay - appears during active drills */}
      <DrillAlertOverlay />
      <Header onSignOut={handleSignOut} studentId={profile?.id} />
      <div className="container mx-auto px-4 pt-6">
        <SafetyAlertBanner />
      </div>
      <div className="flex flex-1">
        {/* Desktop sidebar - visible on lg and above */}
        <div className="hidden lg:block">
          <StudentDashboardSidebar 
            activeSection={activeSection} 
            onSectionChange={setActiveSection}
            onNavigateToGames={() => navigate('/games')}
            onNavigateToAuraReading={() => navigate('/student/aura-practice')}
          />
        </div>
        
        {/* Mobile hamburger menu + Sheet - visible below md only */}
        <div className="block md:hidden fixed top-20 left-4 z-50">
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetTrigger asChild>
              <button className="p-2.5 rounded-xl bg-background/90 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-muted/80 transition-colors">
                <Menu className="h-5 w-5 text-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <StudentDashboardSidebar 
                activeSection={activeSection} 
                onSectionChange={setActiveSection}
                onNavigateToGames={() => navigate('/games')}
                onNavigateToAuraReading={() => navigate('/student/aura-practice')}
                isSheet={true}
                onClose={() => setMobileSidebarOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* Tablet hamburger menu + Sheet - visible on md to lg only */}
        <div className="hidden md:block lg:hidden fixed top-20 left-4 z-50">
          <Sheet open={tabletSidebarOpen} onOpenChange={setTabletSidebarOpen}>
            <SheetTrigger asChild>
              <button className="p-2.5 rounded-xl bg-background/90 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-muted/80 transition-colors">
                <Menu className="h-5 w-5 text-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <StudentDashboardSidebar 
                activeSection={activeSection} 
                onSectionChange={setActiveSection}
                onNavigateToGames={() => navigate('/games')}
                onNavigateToAuraReading={() => navigate('/student/aura-practice')}
                isSheet={true}
                onClose={() => setTabletSidebarOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">{renderSection()}</div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default StudentDashboard;
