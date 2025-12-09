import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Loader2, UserPlus, Calendar as CalendarIcon, Bell, Shield, ChevronRight } from "lucide-react";
import { ParentNotificationBell } from "@/components/parent/ParentNotificationBell";
import { StudentLookupModal } from "@/components/parent/StudentLookupModal";
import { ParentOutgoingRequestsList } from "@/components/parent/ParentOutgoingRequestsList";
import { ParentStudentOverview } from "@/components/parent/ParentStudentOverview";
import { ParentRecentActivity } from "@/components/parent/ParentRecentActivity";
import { ParentUpcomingAssignments } from "@/components/parent/ParentUpcomingAssignments";
import { ParentAnnouncementsFeed } from "@/components/parent/ParentAnnouncementsFeed";
import { ParentQuickInsights } from "@/components/parent/ParentQuickInsights";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarWidget } from "@/components/calendar/CalendarWidget";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ParentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [parentId, setParentId] = useState<string | null>(null);
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
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

  const { data: approvedChildren } = useQuery({
    queryKey: ["parent-children", parentId],
    queryFn: async () => {
      if (!parentId) return [];
      const { data } = await supabase
        .from("parent_student_links")
        .select(`
          student_id,
          profiles:student_id (
            id,
            full_name,
            classroom_students (
              classroom_id
            )
          )
        `)
        .eq("parent_id", parentId)
        .eq("approved", true);
      return data || [];
    },
    enabled: !!parentId,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const firstChild = approvedChildren?.[0];
  const firstChildId = firstChild?.student_id;
  const firstChildName = (firstChild?.profiles as any)?.full_name || "Student";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <Header>
        {parentId && <ParentNotificationBell parentId={parentId} />}
      </Header>
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Parent Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Stay connected with your child's education</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {firstChildId && (
              <>
                <Button variant="outline" onClick={() => navigate("/parent/calendar")} className="gap-2 shadow-sm bg-card/80 backdrop-blur-sm">
                  <CalendarIcon className="h-4 w-4" /> Calendar
                </Button>
                <Button variant="outline" onClick={() => navigate("/parent/safety")} className="gap-2 shadow-sm bg-card/80 backdrop-blur-sm">
                  <Shield className="h-4 w-4" /> Safety
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => navigate("/parent/notification-settings")} className="gap-2 shadow-sm bg-card/80 backdrop-blur-sm">
              <Bell className="h-4 w-4" /> Notifications
            </Button>
            <Button onClick={() => setLookupModalOpen(true)} className="gap-2 shadow-lg">
              <UserPlus className="h-4 w-4" /> Link Student
            </Button>
          </div>
        </div>

        {/* No Children Linked */}
        {!firstChildId && (
          <Card className="mb-8 border-2 border-dashed shadow-lg bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center space-y-6 py-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Get Started</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Link your first student to start monitoring their progress, viewing assignments, and staying connected.
                  </p>
                </div>
                <Button onClick={() => setLookupModalOpen(true)} size="lg" className="shadow-md">
                  <UserPlus className="h-5 w-5 mr-2" /> Link Your First Student
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard Content */}
        {firstChildId && (
          <div className="space-y-8">
            {/* Student Overview */}
            <ParentStudentOverview studentId={firstChildId} studentName={firstChildName} />

            {/* Multi-child tabs if needed */}
            {approvedChildren && approvedChildren.length > 1 && (
              <Tabs defaultValue={firstChildId} className="space-y-4">
                <TabsList>
                  {approvedChildren.map((child: any) => (
                    <TabsTrigger key={child.student_id} value={child.student_id}>
                      {child.profiles?.full_name || "Student"}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}

            {/* Insights + Activity Row */}
            <div className="grid lg:grid-cols-2 gap-6">
              <ParentQuickInsights studentId={firstChildId} studentName={firstChildName} />
              <ParentRecentActivity studentId={firstChildId} />
            </div>

            {/* Assignments + Announcements Row */}
            <div className="grid lg:grid-cols-2 gap-6">
              <ParentUpcomingAssignments studentId={firstChildId} />
              <ParentAnnouncementsFeed studentId={firstChildId} />
            </div>

            {/* Calendar Widget */}
            {session?.user?.id && (
              <CalendarWidget userId={session.user.id} userRole="parent" childId={firstChildId} />
            )}

            {/* View Child Details Button */}
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate(`/parent/child/${firstChildId}`)}
                className="gap-2 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
              >
                View Full Student Profile <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Access Requests */}
        {parentId && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> My Student Access Requests
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
