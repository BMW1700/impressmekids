import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ClassroomCard } from "@/components/ClassroomCard";
import { CreateClassroomModal } from "@/components/CreateClassroomModal";
import { MLModelTraining } from "@/components/teacher/MLModelTraining";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Users, Trophy, BookOpen, Loader2, BarChart3, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TeacherDashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadDashboardData();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔍 TeacherDashboard: Checking authentication...');
      
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

      if (profileData.role !== 'teacher') {
        console.log(`⚠️ User role is ${profileData.role}, not teacher. Redirecting to student dashboard`);
        navigate('/student/dashboard');
        return;
      }

      console.log('✅ Teacher access confirmed');
      setProfile(profileData);
    } catch (error) {
      console.error('❌ Auth check error:', error);
      navigate('/auth');
    }
  };

  const loadDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: classroomsData, error } = await supabase
        .from('classrooms')
        .select(`
          *,
          classroom_students(count)
        `)
        .eq('teacher_id', session.user.id);

      if (error) throw error;
      setClassrooms(classroomsData || []);
    } catch (error: any) {
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
              Welcome, {profile?.full_name}! 👋
            </h1>
            <p className="text-muted-foreground">Teacher Dashboard</p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="hover:scale-[1.02] transition-transform duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Classrooms</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classrooms.length}</div>
              </CardContent>
            </Card>
            <Card className="hover:scale-[1.02] transition-transform duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {classrooms.reduce((acc, c) => acc + (c.classroom_students?.[0]?.count || 0), 0)}
                </div>
              </CardContent>
            </Card>
            <Card className="hover:scale-[1.02] transition-transform duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  Games Played
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="classrooms" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="classrooms">
                <Users className="h-4 w-4 mr-2" />
                Classrooms
              </TabsTrigger>
              <TabsTrigger value="actions">
                <BookOpen className="h-4 w-4 mr-2" />
                Quick Actions
              </TabsTrigger>
              <TabsTrigger value="ml-training">
                <Brain className="h-4 w-4 mr-2" />
                ML Training
              </TabsTrigger>
            </TabsList>

            <TabsContent value="classrooms" className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Classrooms</h2>
                <Button 
                  className="bg-gradient-primary hover:opacity-90"
                  onClick={() => setShowCreateModal(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Classroom
                </Button>
              </div>

              {classrooms.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="h-24 w-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                      <Users className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No Classrooms Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first classroom to start inviting students and playing games!
                    </p>
                    <Button 
                      className="bg-gradient-primary hover:opacity-90"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Your First Classroom
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classrooms.map((classroom) => (
                    <div key={classroom.id} className="hover:scale-[1.02] transition-transform duration-200">
                      <ClassroomCard
                        id={classroom.id}
                        name={classroom.name}
                        joinCode={classroom.join_code}
                        studentCount={classroom.classroom_students?.[0]?.count || 0}
                        createdAt={classroom.created_at}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="actions" className="mt-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="hover:shadow-purple transition-shadow cursor-pointer" onClick={() => navigate('/games')}>
                  <CardHeader>
                    <CardTitle>Browse Games</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Explore our collection of educational games for your classroom
                    </p>
                    <Button variant="outline" className="w-full">
                      View Games →
                    </Button>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-blue transition-shadow cursor-pointer" onClick={() => navigate('/teacher/aura-analytics')}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      AURA Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Track student speaking progress and pronunciation skills
                    </p>
                    <Button variant="outline" className="w-full">
                      View Analytics →
                    </Button>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-yellow transition-shadow">
                  <CardHeader>
                    <CardTitle>Need Help?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Check out our teacher guides and resources
                    </p>
                    <Button variant="outline" className="w-full justify-between">
                      View Resources
                      <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ml-training" className="mt-6">
              <MLModelTraining />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
      
      <CreateClassroomModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={loadDashboardData}
      />
    </div>
  );
};

export default TeacherDashboard;
