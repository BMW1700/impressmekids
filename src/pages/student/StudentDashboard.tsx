import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Menu } from "lucide-react";
import { useStudentAssignmentStats } from "@/hooks/useStudentAssignmentStats";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { StudentDashboardSidebar } from "@/components/student/StudentDashboardSidebar";
import { SafetyAlertBanner } from "@/components/safety/SafetyAlertBanner";
import { DrillAlertOverlay } from "@/components/student/DrillAlertOverlay";
import { useAuth } from "@/contexts/AuthContext";

// Lazy load all sections for faster initial render
const HomeSection = lazy(() => import("@/components/student/sections/HomeSection").then(m => ({ default: m.HomeSection })));
const TodaySection = lazy(() => import("@/components/student/sections/TodaySection").then(m => ({ default: m.TodaySection })));
const CoursesSection = lazy(() => import("@/components/student/sections/CoursesSection").then(m => ({ default: m.CoursesSection })));
const ClubsSection = lazy(() => import("@/components/student/sections/ClubsSection").then(m => ({ default: m.ClubsSection })));
const CalendarSection = lazy(() => import("@/components/student/sections/CalendarSection").then(m => ({ default: m.CalendarSection })));
const AnnouncementsSection = lazy(() => import("@/components/student/sections/AnnouncementsSection").then(m => ({ default: m.AnnouncementsSection })));
const GradebookSection = lazy(() => import("@/components/student/sections/GradebookSection").then(m => ({ default: m.GradebookSection })));
const GamesSection = lazy(() => import("@/components/student/sections/GamesSection").then(m => ({ default: m.GamesSection })));
const AuraReadingSection = lazy(() => import("@/components/student/sections/AuraReadingSection").then(m => ({ default: m.AuraReadingSection })));
const DirectorySection = lazy(() => import("@/components/student/sections/DirectorySection").then(m => ({ default: m.DirectorySection })));
const AccountSection = lazy(() => import("@/components/student/sections/AccountSection").then(m => ({ default: m.AccountSection })));
const SafetySection = lazy(() => import("@/components/student/sections/SafetySection").then(m => ({ default: m.SafetySection })));
const LinksResourcesSection = lazy(() => import("@/components/student/sections/LinksResourcesSection").then(m => ({ default: m.LinksResourcesSection })));

// Section loading skeleton
const SectionLoader = () => (
  <div className="py-12 flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const StudentDashboard = () => {
  const { user, profile, isLoading: authLoading, isProfileLoading, signOut } = useAuth();
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("home");
  const [tabletSidebarOpen, setTabletSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: assignmentStats } = useStudentAssignmentStats(profile?.id);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/auth");
      return;
    }

    // Wait for profile (async) instead of redirecting prematurely
    if (isProfileLoading || !profile) return;

    // Role redirects
    if (profile.role === "district_manager") {
      navigate("/district-manager/dashboard");
      return;
    }
    if (profile.role === "teacher") {
      navigate("/teacher/dashboard");
      return;
    }
    if (profile.role === "admin") {
      navigate("/admin/dashboard");
      return;
    }
    if (profile.role === "parent") {
      navigate("/parent/dashboard");
      return;
    }

    // Verification check
    if (!profile.is_verified) {
      navigate("/pending-verification");
      return;
    }

    // Load data in parallel
    loadDashboardData();
  }, [authLoading, isProfileLoading, user, profile]);

  const loadDashboardData = async () => {
    if (!user) return;

    setIsDataLoading(true);

    try {
      // Fetch all data in parallel
      const [classroomsResult, publicProfileResult, studentDataResult] = await Promise.all([
        supabase.rpc("get_student_classrooms", { _user_id: user.id }),
        supabase.from("public_profiles").select("*").eq("id", user.id).single(),
        supabase.from("student_profiles").select("stats").eq("user_id", user.id).single(),
      ]);

      if (classroomsResult.data) setClassrooms(classroomsResult.data);

      // Handle student profile creation if needed
      if (!studentDataResult.data) {
        const { data: newProfile } = await supabase
          .from("student_profiles")
          .insert({ user_id: user.id, stats: { games_played: 0, games_won: 0 } })
          .select()
          .single();
        setStudentProfile({ ...publicProfileResult.data, stats: newProfile?.stats });
      } else {
        setStudentProfile({ ...publicProfileResult.data, stats: studentDataResult.data.stats });
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast({ title: "Error", description: "Failed to load profile", variant: "destructive" });
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const renderSection = () => {
    if (!profile) return null;
    const content = (() => {
      switch (activeSection) {
        case "home": return <HomeSection userProfile={profile} studentProfile={studentProfile} assignmentStats={assignmentStats} classrooms={classrooms} />;
        case "today": return <TodaySection studentId={profile.id} />;
        case "courses": return <CoursesSection classrooms={classrooms} />;
        case "clubs": return <ClubsSection studentId={profile.id} />;
        case "calendar": return <CalendarSection studentId={profile.id} />;
        case "announcements": return <AnnouncementsSection studentId={profile.id} />;
        case "study-games": return <GamesSection />;
        case "aura-reading": return <AuraReadingSection />;
        case "safety": return <SafetySection />;
        case "links-resources": return <LinksResourcesSection />;
        case "gradebook": return <GradebookSection studentId={profile.id} />;
        case "directory": return <DirectorySection />;
        case "account": return <AccountSection userProfile={profile} studentProfile={studentProfile} />;
        default: return <HomeSection userProfile={profile} studentProfile={studentProfile} assignmentStats={assignmentStats} />;
      }
    })();
    return <Suspense fallback={<SectionLoader />}>{content}</Suspense>;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
          <div className="container mx-auto px-4 py-8">
            {isProfileLoading || !profile ? (
              <div className="py-20 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : isDataLoading ? (
              <div className="py-20 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              renderSection()
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default StudentDashboard;
