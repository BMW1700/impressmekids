import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ClassroomCard } from "@/components/ClassroomCard";
import { CreateClassroomModal } from "@/components/CreateClassroomModal";
import { MLModelTraining } from "@/components/teacher/MLModelTraining";
import { TeacherSuccessBoard } from "@/components/teacher/TeacherSuccessBoard";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Users, Trophy, BookOpen, Loader2, BarChart3, Brain } from "lucide-react";

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

      // Fetch user profile with retry logic
      let profileData = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts && !profileData) {
        attempts++;
        console.log(`📋 Fetching profile (attempt ${attempts}/${maxAttempts})...`);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!error && data) {
          profileData = data;
          console.log('✅ Profile found:', { id: data.id, role: data.role });
        } else if (attempts < maxAttempts) {
          console.log('⏳ Profile not ready, waiting...');
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          console.error('❌ Failed to fetch profile:', error);
        }
      }

      if (!profileData) {
        console.log('❌ No profile found after retries');
        navigate('/auth');
        return;
      }

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuthButtons={false} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome, {profile?.full_name}! 👋
              </h1>
              <p className="text-muted-foreground">Teacher Dashboard</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>

          {/* Teacher Success Board */}
          <TeacherSuccessBoard classroomId={classrooms[0]?.id} />

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Classrooms</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classrooms.length}</div>
              </CardContent>
            </Card>
            <Card>
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Games Played</CardTitle>
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
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
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
                    <ClassroomCard
                      key={classroom.id}
                      id={classroom.id}
                      name={classroom.name}
                      joinCode={classroom.join_code}
                      studentCount={classroom.classroom_students?.[0]?.count || 0}
                      createdAt={classroom.created_at}
                    />
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
                    <Button variant="outline" className="w-full">
                      View Resources →
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
