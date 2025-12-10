import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ClassroomCard } from "@/components/ClassroomCard";
import { CreateClassroomModal } from "@/components/CreateClassroomModal";
import { MLModelTraining } from "@/components/teacher/MLModelTraining";
import { AllStudentsDialog } from "@/components/teacher/AllStudentsDialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Users, Trophy, BookOpen, Loader2, BarChart3, Brain, Calendar as CalendarIcon, Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Directory } from "@/components/Directory";
import { ClassroomLeaderboard } from "@/components/ClassroomLeaderboard";
const TeacherDashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStudentsDialog, setShowStudentsDialog] = useState(false);
  const [classroomsWithStudents, setClassroomsWithStudents] = useState<any[]>([]);
  const [totalStudentCount, setTotalStudentCount] = useState(0);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    checkAuth();
    loadDashboardData();
  }, []);
  const checkAuth = async () => {
    try {
      console.log('🔍 TeacherDashboard: Checking authentication...');
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        console.log('❌ No session found, redirecting to auth');
        navigate('/auth');
        return;
      }
      console.log('✅ Session found:', session.user.id);

      // Fetch user profile using security definer function
      const {
        data: profileResult,
        error: profileError
      } = await supabase.rpc('get_user_profile', {
        _user_id: session.user.id
      });
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
      console.log('✅ Profile found:', {
        id: profileData.id,
        role: profileData.role
      });
      if (profileData.role !== 'teacher') {
        console.log(`⚠️ User role is ${profileData.role}, not teacher. Redirecting to student dashboard`);
        navigate('/student/dashboard');
        return;
      }

      // Check verification status (teachers must be verified to access dashboard)
      const {
        data: profileDetails
      } = await supabase.from('profiles').select('is_verified').eq('id', session.user.id).single();
      if (!profileDetails?.is_verified) {
        console.log('⚠️ Teacher not verified, redirecting to pending verification');
        navigate('/pending-verification');
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
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) return;
      const {
        data: classroomsData,
        error
      } = await supabase.rpc('get_teacher_classrooms', {
        p_teacher_id: session.user.id
      });
      if (error) throw error;
      setClassrooms(classroomsData || []);

      // Fetch student counts for all classrooms
      if (classroomsData && classroomsData.length > 0) {
        const {
          data: studentCounts
        } = await supabase.from('classroom_students').select('classroom_id', {
          count: 'exact',
          head: false
        }).in('classroom_id', classroomsData.map((c: any) => c.id));
        const totalCount = studentCounts?.length || 0;
        setTotalStudentCount(totalCount);
      } else {
        setTotalStudentCount(0);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const loadAllStudents = async () => {
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch all classrooms with their students
      const classroomsWithStudentsData = await Promise.all(classrooms.map(async classroom => {
        const {
          data: students
        } = await supabase.from('classroom_students').select(`
              student_id,
              joined_at,
              profiles:student_id (
                id,
                full_name,
                email
              )
            `).eq('classroom_id', classroom.id).order('joined_at', {
          ascending: true
        });
        return {
          id: classroom.id,
          name: classroom.name,
          subject: classroom.subject,
          grade: classroom.grade,
          students: students?.map(s => ({
            id: s.profiles.id,
            full_name: s.profiles.full_name,
            email: s.profiles.email,
            joined_at: s.joined_at
          })) || []
        };
      }));
      setClassroomsWithStudents(classroomsWithStudentsData);
      setShowStudentsDialog(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load student data",
        variant: "destructive"
      });
    }
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen flex flex-col">
      <Header showAuthButtons={false} onSignOut={handleSignOut} />
      
      <main className="flex-1 py-8 animate-fade-in">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-b from-[#8B5CF6] to-[#C4A7E7] bg-clip-text text-transparent">
              Welcome, {profile?.full_name}! <span className="text-purple-400">👋</span>
            </h1>
            <p className="text-muted-foreground text-lg">Your AI-Powered Classroom Command Center</p>
          </div>

          {/* ML Spotlight Widget - Exact Match */}
          <Card className="mb-8 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold">AI Insights Dashboard</h3>
                    <Badge className="bg-amber-400 text-amber-900 hover:bg-amber-400 border-0">
                      <Sparkles className="h-3 w-3 mr-1" />
                      4 Patents
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Revolutionary machine learning models predict reading outcomes, identify at-risk students, and prescribe personalized interventions.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => navigate('/teacher/aura-analytics')}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                    <Button variant="outline" className="bg-white hover:bg-gray-50" onClick={() => navigate('/teacher/aura-analytics')}>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      At-Risk Students
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards - Exact Match */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Classrooms</CardTitle>
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <Users className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black bg-gradient-to-b from-[#9B6DD6] to-[#D4A04A] bg-clip-text text-transparent">
                    {classrooms.length}
                  </span>
                  <span className="text-sm text-emerald-500 font-medium flex items-center gap-0.5">
                    ↗ Active
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={loadAllStudents}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black bg-gradient-to-b from-[#9B6DD6] to-[#D4A04A] bg-clip-text text-transparent">
                    {totalStudentCount}
                  </span>
                  <span className="text-sm text-emerald-500 font-medium flex items-center gap-0.5">
                    ↗ Enrolled
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Assignments</CardTitle>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black bg-gradient-to-b from-[#9B6DD6] to-[#D4A04A] bg-clip-text text-transparent">
                    {classrooms.length > 0 ? classrooms.length * 3 : 0}
                  </span>
                  <Badge className="bg-amber-400 text-amber-900 hover:bg-amber-400 border-0 text-xs">ML-Powered</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="classrooms" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="classrooms">
                <Users className="h-4 w-4 mr-2" />
                Classrooms
              </TabsTrigger>
              <TabsTrigger value="leaderboard">
                <Trophy className="h-4 w-4 mr-2" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="calendar" onClick={() => navigate('/teacher/calendar')}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="directory">
                <Users className="h-4 w-4 mr-2" />
                Directory
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
                <Button className="bg-gradient-primary hover:opacity-90" onClick={() => setShowCreateModal(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Classroom
                </Button>
              </div>

              {classrooms.length === 0 ? <Card className="p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="h-24 w-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                      <Users className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No Classrooms Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first classroom to start inviting students and playing games!
                    </p>
                    <Button className="bg-gradient-primary hover:opacity-90" onClick={() => setShowCreateModal(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Your First Classroom
                    </Button>
                  </div>
                </Card> : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classrooms.map(classroom => <div key={classroom.id} className="hover:scale-[1.02] transition-transform duration-200">
                      <ClassroomCard id={classroom.id} name={classroom.name} joinCode={classroom.join_code} studentCount={Number(classroom.student_count) || 0} createdAt={classroom.created_at} />
                    </div>)}
                </div>}
            </TabsContent>

            <TabsContent value="leaderboard" className="mt-6 space-y-6">
              {classrooms.length === 0 ? <Card className="p-12 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Create a classroom to view leaderboards
                  </p>
                </Card> : classrooms.map(classroom => <div key={classroom.id}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold">{classroom.name}</h3>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/classrooms/${classroom.id}?tab=leaderboard`)}>
                        View Full Leaderboard →
                      </Button>
                    </div>
                    <ClassroomLeaderboard classroomId={classroom.id} limit={3} />
                  </div>)}
            </TabsContent>

            <TabsContent value="directory" className="mt-6">
              <Directory />
            </TabsContent>

            <TabsContent value="actions" className="mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="hover:scale-[1.02] hover:shadow-purple transition-all duration-300 cursor-pointer border-primary/20 bg-gradient-to-br from-primary/5 to-background" onClick={() => navigate('/games')}>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-gradient-primary">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-lg">Browse Games</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">
                      Explore educational games for your classroom
                    </p>
                    <Button variant="outline" className="w-full group" size="sm">
                      View Games
                      <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:scale-[1.02] hover:shadow-purple transition-all duration-300 cursor-pointer border-primary/20 bg-gradient-to-br from-secondary/5 to-background" onClick={() => navigate('/teacher/aura-analytics')}>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-gradient-hero">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-lg">AURA Analytics</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">
                      Track student pronunciation with AI
                    </p>
                    <Button variant="outline" className="w-full group" size="sm">
                      View Analytics
                      <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:scale-[1.02] hover:shadow-purple transition-all duration-300 cursor-pointer border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-background" onClick={() => navigate('/teacher/story-library')}>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-lg">Story Library</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">
                      Create & manage reading stories
                    </p>
                    <Button variant="outline" className="w-full group" size="sm">
                      Manage Stories
                      <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:scale-[1.02] hover:shadow-card transition-all duration-300 border-muted">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-muted">
                        <Sparkles className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-lg">Resources</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">
                      Teacher guides and best practices
                    </p>
                    <Button variant="outline" className="w-full justify-between" size="sm" disabled>
                      View Resources
                      <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
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
      
      <CreateClassroomModal open={showCreateModal} onOpenChange={setShowCreateModal} onSuccess={loadDashboardData} />
      
      <AllStudentsDialog open={showStudentsDialog} onOpenChange={setShowStudentsDialog} classrooms={classroomsWithStudents} totalStudents={totalStudentCount} />
    </div>;
};
export default TeacherDashboard;