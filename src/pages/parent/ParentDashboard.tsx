import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Loader2, UserPlus, Calendar as CalendarIcon, Bell, Shield, ChevronRight, GraduationCap, Sparkles } from "lucide-react";
import { ParentNotificationBell } from "@/components/parent/ParentNotificationBell";
import { StudentLookupModal } from "@/components/parent/StudentLookupModal";
import { ParentOutgoingRequestsList } from "@/components/parent/ParentOutgoingRequestsList";
import { ParentStudentOverview } from "@/components/parent/ParentStudentOverview";
import { ParentRecentActivity } from "@/components/parent/ParentRecentActivity";
import { ParentUpcomingAssignments } from "@/components/parent/ParentUpcomingAssignments";
import { ParentAnnouncementsFeed } from "@/components/parent/ParentAnnouncementsFeed";
import { ParentQuickInsights } from "@/components/parent/ParentQuickInsights";
import { ParentGradebookSection } from "@/components/parent/ParentGradebookSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarWidget } from "@/components/calendar/CalendarWidget";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ParentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [parentId, setParentId] = useState<string | null>(null);
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLookupSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["parent-student-links"] });
    queryClient.invalidateQueries({ queryKey: ["parent-access-requests", parentId] });
    queryClient.invalidateQueries({ queryKey: ["parent-children", parentId] });
  };

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: approvedChildren, isLoading: childrenLoading } = useQuery({
    queryKey: ["parent-children", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const { data, error } = await supabase.rpc("get_parent_children", { 
        _parent_user_id: session.user.id 
      });
      if (error) {
        console.error("Error fetching children:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data: profileData } = await supabase.rpc('get_user_profile', { _user_id: session.user.id });
      if (!profileData || profileData.length === 0) { navigate("/auth"); return; }

      const userRole = profileData[0].role;
      if (userRole !== 'parent') {
        if (userRole === 'teacher') navigate('/teacher/dashboard');
        else if (userRole === 'district_admin') navigate('/district/dashboard');
        else navigate('/student/dashboard');
        return;
      }

      const { data: profileDetails } = await supabase
        .from('profiles').select('is_verified').eq('id', session.user.id).single();
      if (!profileDetails?.is_verified) { navigate('/pending-verification'); return; }

      const { data: parentAccount } = await supabase.rpc("get_parent_account", { _user_id: session.user.id });
      if (!parentAccount || parentAccount.length === 0) {
        const { data: newParent } = await supabase
          .from("parent_accounts")
          .insert({ user_id: session.user.id, email: session.user.email || "", full_name: session.user.user_metadata?.full_name || "Parent" })
          .select().single();
        if (newParent) setParentId(newParent.id);
      } else {
        setParentId(parentAccount[0].id);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error in checkAuth:", error);
      setLoading(false);
    }
  };

  if (loading || childrenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex flex-col items-center gap-4">
          <div className="icon-circle icon-circle-lg icon-circle-purple">
            <Loader2 className="h-7 w-7 animate-spin text-white" />
          </div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const firstChild = approvedChildren?.[0];
  const hasChildren = approvedChildren && approvedChildren.length > 0;
  const hasMultipleChildren = approvedChildren && approvedChildren.length > 1;
  
  // Set initial selected child when children load
  const activeChildId = selectedChildId || firstChild?.student_id;
  const activeChild = approvedChildren?.find(c => c.student_id === activeChildId) || firstChild;
  const activeChildName = activeChild?.full_name || "Student";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-secondary/[0.06] via-secondary/[0.02] to-primary/[0.03]">
      <Header>
        {parentId && <ParentNotificationBell parentId={parentId} />}
      </Header>
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl relative">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/[0.04] rounded-full blur-3xl pointer-events-none" />
        {/* Premium Header */}
        <div className="mb-10 flex items-start justify-between flex-wrap gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="icon-circle icon-circle-purple">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="hero-title gradient-text">
                Parent Dashboard
              </h1>
            </div>
            <p className="text-lg text-muted-foreground ml-[68px]">
              Stay connected with your child's education journey
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {hasChildren && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/parent/calendar")} 
                  className="gap-2 glass-card border-0 hover:bg-primary/5"
                >
                  <CalendarIcon className="h-4 w-4" /> Calendar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/parent/safety")} 
                  className="gap-2 glass-card border-0 hover:bg-primary/5"
                >
                  <Shield className="h-4 w-4" /> Safety
                </Button>
              </>
            )}
            <Button 
              variant="outline" 
              onClick={() => navigate("/parent/notification-settings")} 
              className="gap-2 glass-card border-0 hover:bg-primary/5"
            >
              <Bell className="h-4 w-4" /> Notifications
            </Button>
            <Button 
              variant="gradient"
              onClick={() => setLookupModalOpen(true)} 
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" /> Link Student
            </Button>
          </div>
        </div>

        {/* No Children Linked - Premium Empty State */}
        {!hasChildren && (
          <Card variant="glass" className="mb-8 border-2 border-dashed border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-8 py-12">
                <div className="icon-circle icon-circle-lg icon-circle-purple mx-auto">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-3 gradient-text">Get Started</h3>
                  <p className="text-muted-foreground max-w-lg mx-auto text-lg">
                    Link your first student to start monitoring their progress, viewing assignments, and staying connected with their education.
                  </p>
                </div>
                <Button 
                  variant="gradient"
                  size="lg"
                  onClick={() => setLookupModalOpen(true)} 
                >
                  <UserPlus className="h-5 w-5 mr-2" /> Link Your First Student
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard Content */}
        {hasChildren && activeChildId && (
          <div className="space-y-6">
            {/* Student Tabs - Only show if multiple children */}
            {hasMultipleChildren && (
              <div className="flex gap-2 flex-wrap">
                {approvedChildren.map((child) => (
                  <Button
                    key={child.student_id}
                    variant={activeChildId === child.student_id ? "gradient" : "outline"}
                    onClick={() => setSelectedChildId(child.student_id)}
                    className={activeChildId === child.student_id 
                      ? "" 
                      : "glass-card border-0 hover:bg-primary/5"
                    }
                  >
                    {child.full_name || "Student"}
                  </Button>
                ))}
              </div>
            )}

            {/* Overview/Gradebook Tabs */}
            <Tabs defaultValue="overview" className="space-y-8">
              <TabsList className="glass-card border-0 p-1.5 h-auto">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-dark data-[state=active]:text-white rounded-lg px-6 py-2.5 transition-all"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="gradebook" 
                  className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-dark data-[state=active]:text-white rounded-lg px-6 py-2.5 transition-all"
                >
                  <GraduationCap className="h-4 w-4" /> Gradebook
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8">
                {/* Student Overview */}
                <ParentStudentOverview studentId={activeChildId} studentName={activeChildName} />

                {/* Insights + Activity Row */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <ParentQuickInsights studentId={activeChildId} studentName={activeChildName} />
                  <ParentRecentActivity studentId={activeChildId} />
                </div>

                {/* Assignments + Announcements Row */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <ParentUpcomingAssignments studentId={activeChildId} />
                  <ParentAnnouncementsFeed studentId={activeChildId} />
                </div>

                {/* Calendar Widget */}
                {session?.user?.id && (
                  <CalendarWidget userId={session.user.id} userRole="parent" childId={activeChildId} />
                )}

                {/* View Child Details Button */}
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => navigate(`/parent/child/${activeChildId}`)}
                    className="gap-2 glass-card border-0 hover:bg-primary/5 transition-all hover:-translate-y-1"
                  >
                    View Full Student Profile <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="gradebook">
                <ParentGradebookSection studentId={activeChildId} studentName={activeChildName} />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Access Requests */}
        {parentId && (
          <div className="mt-10">
            <h2 className="section-header flex items-center gap-3">
              <div className="icon-circle icon-circle-sm icon-circle-blue">
                <UserPlus className="h-4 w-4 text-white" />
              </div>
              My Student Access Requests
            </h2>
            <ParentOutgoingRequestsList parentId={parentId} />
          </div>
        )}
      </main>

      <Footer />

      {parentId && (
        <StudentLookupModal
          open={lookupModalOpen}
          onOpenChange={setLookupModalOpen}
          parentId={parentId}
          onSuccess={handleLookupSuccess}
        />
      )}
    </div>
  );
};

export default ParentDashboard;