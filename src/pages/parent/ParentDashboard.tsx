import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Loader2, UserPlus, Calendar as CalendarIcon, BookOpen, Bell, TrendingUp } from "lucide-react";
import { ParentNotificationBell } from "@/components/parent/ParentNotificationBell";
import { StudentLookupModal } from "@/components/parent/StudentLookupModal";
import { ParentOutgoingRequestsList } from "@/components/parent/ParentOutgoingRequestsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarWidget } from "@/components/calendar/CalendarWidget";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Directory } from "@/components/Directory";

const ParentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [parentId, setParentId] = useState<string | null>(null);
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLookupSuccess = () => {
    console.log("🔄 Invalidating queries after lookup success for parentId:", parentId);
    queryClient.invalidateQueries({ queryKey: ["parent-student-links"] });
    queryClient.invalidateQueries({ queryKey: ["parent-access-requests", parentId] });
  };

  // Get current session
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  // Get first approved child for calendar widget
  const { data: approvedChildren } = useQuery({
    queryKey: ["parent-children", parentId],
    queryFn: async () => {
      if (!parentId) return [];
      const { data } = await supabase
        .from("parent_student_links")
        .select("student_id")
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
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Verify user is actually a parent
      const { data: profileData } = await supabase
        .rpc('get_user_profile', { _user_id: session.user.id });

      if (!profileData || profileData.length === 0) {
        console.error("Profile not found");
        navigate("/auth");
        return;
      }

      const userRole = profileData[0].role;
      
      // Redirect non-parents to their correct dashboard
      if (userRole !== 'parent') {
        if (userRole === 'teacher') {
          navigate('/teacher/dashboard');
        } else if (userRole === 'district_admin') {
          navigate('/district/dashboard');
        } else {
          navigate('/student/dashboard');
        }
        return;
      }

      // Use security definer function to get parent account
      const { data: parentAccount } = await supabase
        .rpc("get_parent_account", { _user_id: session.user.id });

      if (!parentAccount || parentAccount.length === 0) {
        // Create parent account if it doesn't exist
        const { data: newParent } = await supabase
          .from("parent_accounts")
          .insert({
            user_id: session.user.id,
            email: session.user.email || "",
            full_name: session.user.user_metadata?.full_name || "Parent"
          })
          .select()
          .single();

        if (newParent) {
          setParentId(newParent.id);
        }
      } else {
        console.log("✅ Parent account found:", parentAccount[0].id);
        setParentId(parentAccount[0].id);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error in checkAuth:", error);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  console.log("🔗 ParentDashboard rendering with parentId:", parentId);

  const firstChildId = approvedChildren?.[0]?.student_id;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <Header showAuthButtons={false} onSignOut={handleSignOut}>
        {parentId && <ParentNotificationBell parentId={parentId} />}
      </Header>
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Welcome, Parent! 👋
            </h1>
            <p className="text-muted-foreground mt-1">Monitor and support your children's learning journey</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {parentId && firstChildId && (
              <Button variant="outline" onClick={() => navigate("/parent/calendar")} className="gap-2 shadow-sm">
                <CalendarIcon className="h-4 w-4" />
                Calendar
              </Button>
            )}
            {parentId && (
              <>
                <Button variant="outline" onClick={() => navigate("/parent/notification-settings")} className="gap-2 shadow-sm">
                  <Bell className="h-4 w-4" />
                  Notifications
                </Button>
                <Button onClick={() => setLookupModalOpen(true)} className="gap-2 shadow-sm">
                  <UserPlus className="h-4 w-4" />
                  Link Student
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Empty State: No Children Linked Yet */}
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
                    Link your first student to start monitoring their progress, viewing assignments, and staying connected with their learning.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Click Link Student</p>
                      <p className="text-xs text-muted-foreground">Find the button above</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Enter Student Code</p>
                      <p className="text-xs text-muted-foreground">Get it from your child</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Wait for Approval</p>
                      <p className="text-xs text-muted-foreground">Teacher will review</p>
                    </div>
                  </div>
                </div>
                <Button onClick={() => setLookupModalOpen(true)} size="lg" className="shadow-md">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Link Your First Student
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Calendar Widget */}
          {parentId && firstChildId && session?.user?.id ? (
            <CalendarWidget
              userId={session.user.id}
              userRole="parent"
              childId={firstChildId}
            />
          ) : (
            <Card className="border shadow-sm bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Calendar Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-12">
                  <CalendarIcon className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Link a student to view their calendar and upcoming assignments
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions or Benefits */}
          {firstChildId ? (
            <Card className="border shadow-sm bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-accent/50 transition-colors"
                  onClick={() => navigate("/parent/calendar")}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  View Full Calendar
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-accent/50 transition-colors"
                  onClick={() => navigate("/parent/notification-settings")}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Manage Notifications
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-accent/50 transition-colors"
                  onClick={() => setLookupModalOpen(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Link Another Student
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border shadow-sm bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>What You'll Get</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Track Progress</p>
                    <p className="text-sm text-muted-foreground">Monitor assignments and grades in real-time</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Stay Informed</p>
                    <p className="text-sm text-muted-foreground">Get notifications about important events</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Support Learning</p>
                    <p className="text-sm text-muted-foreground">See what your child is working on</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {parentId && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              My Student Access Requests
            </h2>
            <ParentOutgoingRequestsList parentId={parentId} />
          </div>
        )}

        {/* Directory */}
        <div className="mb-8">
          <Directory />
        </div>
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