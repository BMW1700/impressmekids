import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Copy, Trophy, Play, Megaphone, BookOpen, GraduationCap, FileText, MoreVertical, Trash2, Mic, Eye, EyeOff, UserCheck, BarChart3, Calendar, Plus, Shield, MessageSquare, Grid3X3 } from "lucide-react";
import { DiscussionBoard } from "@/components/discussions/DiscussionBoard";
import { RubricsList } from "@/components/rubrics/RubricsList";
import { ClassroomLeaderboard } from "@/components/ClassroomLeaderboard";
import { LeaderboardCard } from "@/components/aura/LeaderboardCard";
import { AttendanceTab } from "@/components/teacher/AttendanceTab";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { FlashcardSetViewer } from "@/components/flashcards/FlashcardSetViewer";
import { CreateTournamentModal } from "@/components/tournament/CreateTournamentModal";
import { SelectGameModal } from "@/components/tournament/SelectGameModal";
import { CreateAnnouncementModal } from "@/components/CreateAnnouncementModal";
import { CreateAssignmentModal } from "@/components/CreateAssignmentModal";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { ParentAccessRequestCard } from "@/components/ParentAccessRequestCard";
import { useClassroomPermissions } from "@/hooks/useClassroomPermissions";
import { useAssignments } from "@/hooks/useAssignments";
import { useAssignmentSubmissions } from "@/hooks/useAssignmentSubmissions";
import { useMultiQuestionAssignments } from "@/hooks/useMultiQuestionAssignments";
import { ConfirmModal } from "@/components/ConfirmModal";
import { SubmissionsList } from "@/components/assignments/SubmissionsList";
import { AssignmentStatsCard } from "@/components/assignments/AssignmentStatsCard";
import { StudentAssignmentCard } from "@/components/assignments/StudentAssignmentCard";
import { ClassroomAIInsights } from "@/components/teacher/ClassroomAIInsights";
import { TeacherSuccessBoard } from "@/components/teacher/TeacherSuccessBoard";
import { EditClassroomModal } from "@/components/EditClassroomModal";
import { StudentClassroomTrends } from "@/components/StudentClassroomTrends";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import { SyllabusTab } from "@/components/classroom/SyllabusTab";
import { StandardsProgressDashboard } from "@/components/classroom/StandardsProgressDashboard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TeacherSafetyTab } from "@/components/teacher/TeacherSafetyTab";
import { TeacherBehaviorTab } from "@/components/behavior/TeacherBehaviorTab";
const ClassroomDetail = () => {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    toast
  } = useToast();
  const {
    isTeacher,
    isStudent,
    isLoading: permissionsLoading
  } = useClassroomPermissions(id);
  const [classroom, setClassroom] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [parentRequests, setParentRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [showSelectGame, setShowSelectGame] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState<string>('jeopardy_duel');
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [viewingAssignmentId, setViewingAssignmentId] = useState<string | null>(null);
  const [flashcardSets, setFlashcardSets] = useState<any[]>([]);
  const [viewingFlashcardSet, setViewingFlashcardSet] = useState<any>(null);
  const [deleteAssignmentId, setDeleteAssignmentId] = useState<string | null>(null);
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Test':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'Quiz':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'Homework':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  const [deleteTournamentId, setDeleteTournamentId] = useState<string | null>(null);
  const [showClassGlance, setShowClassGlance] = useState(false);
  const [showEditClassroom, setShowEditClassroom] = useState(false);
  const {
    assignments
  } = useAssignments(id);
  const {
    submissions: assignmentSubmissions
  } = useAssignmentSubmissions(viewingAssignmentId || undefined);
  const {
    deleteAssignment,
    toggleAssignmentStatus
  } = useMultiQuestionAssignments(id);
  useEffect(() => {
    // Wait for permissions to be determined before loading data
    if (!permissionsLoading) {
      loadClassroomData();
    }
  }, [id, permissionsLoading]);
  const loadClassroomData = async () => {
    console.log('🔍 ============================================');
    console.log('🔍 loadClassroomData: STARTING');
    console.log('🔍 Classroom ID:', id);
    console.log('🔍 ============================================');
    let classroomData: any = null;
    try {
      // Get session with detailed logging
      console.log('🔐 Step 1: Getting session...');
      const {
        data: {
          session
        },
        error: sessionError
      } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ Session error:', JSON.stringify(sessionError, null, 2));
        throw sessionError;
      }
      if (!session) {
        console.error('❌ No session found, redirecting to auth');
        navigate('/auth');
        return;
      }
      console.log('✅ Session found. User ID:', session.user.id);
      console.log('📧 User email:', session.user.email);

      // Store user profile
      const {
        data: userProfile
      } = await supabase.rpc('get_user_profile', {
        _user_id: session.user.id
      });
      if (userProfile && userProfile.length > 0) {
        setProfile(userProfile[0]);
      }

      // Query 1: Load classroom using security definer function
      console.log('\n📚 Step 2: Loading classroom...');
      console.log('Query: get_classroom_detail RPC, classroom_id =', id);
      try {
        const {
          data: classroomResult,
          error: classroomError
        } = await supabase.rpc('get_classroom_detail', {
          _user_id: session.user.id,
          _classroom_id: id
        });
        if (classroomError) {
          console.error('❌ CLASSROOM QUERY FAILED');
          console.error('Error code:', classroomError.code);
          console.error('Error message:', classroomError.message);
          console.error('Full error object:', JSON.stringify(classroomError, null, 2));
          throw classroomError;
        }
        if (!classroomResult || classroomResult.length === 0) {
          console.error('❌ Classroom not found or access denied');
          setIsLoading(false);
          return;
        }
        classroomData = classroomResult[0];
        console.log('✅ Classroom loaded:', classroomData.name);
        console.log('   Teacher ID:', classroomData.teacher_id);
        console.log('   Join code:', classroomData.join_code);
        setClassroom(classroomData);
      } catch (err: any) {
        console.error('❌ FATAL: Classroom query exception:', err);
        throw err;
      }

      // Query 2: Load students using security definer function
      console.log('\n👥 Step 3: Loading students...');
      console.log('Query: get_classroom_students RPC, classroom_id =', id);
      try {
        const {
          data: studentsResult,
          error: studentsError
        } = await supabase.rpc('get_classroom_students', {
          _user_id: session.user.id,
          _classroom_id: id
        });
        if (studentsError) {
          console.error('❌ STUDENTS QUERY FAILED');
          console.error('Error code:', studentsError.code);
          console.error('Error message:', studentsError.message);
          console.error('Full error object:', JSON.stringify(studentsError, null, 2));
          throw studentsError;
        }

        // Transform data to match the expected format
        const studentsData = studentsResult?.map((student: any) => ({
          student_id: student.student_id,
          joined_at: student.joined_at,
          profiles: {
            id: student.student_id,
            full_name: student.full_name,
            email: student.email,
            student_profiles: student.grade ? [{
              grade: student.grade,
              avatar_url: student.avatar_url
            }] : []
          }
        })) || [];
        console.log('✅ Students loaded:', studentsData.length, 'students');
        setStudents(studentsData);
      } catch (err: any) {
        console.error('❌ FATAL: Students query exception:', err);
        throw err;
      }

      // Query 3: Load tournaments
      console.log('\n🏆 Step 4: Loading tournaments...');
      console.log('Query: tournaments, classroom_id =', id);
      try {
        const {
          data: tournamentsData,
          error: tournamentsError
        } = await supabase.from('tournaments').select('*').eq('classroom_id', id).order('created_at', {
          ascending: false
        });
        if (tournamentsError) {
          console.error('❌ TOURNAMENTS QUERY FAILED');
          console.error('Error code:', tournamentsError.code);
          console.error('Error message:', tournamentsError.message);
          console.error('Error details:', tournamentsError.details);
          console.error('Error hint:', tournamentsError.hint);
          console.error('Full error object:', JSON.stringify(tournamentsError, null, 2));
          throw tournamentsError;
        }
        console.log('✅ Tournaments loaded:', tournamentsData?.length || 0, 'tournaments');
        setTournaments(tournamentsData || []);
      } catch (err: any) {
        console.error('❌ FATAL: Tournaments query exception:', err);
        throw err;
      }

      // Query 4: Load announcements
      console.log('\n📢 Step 5: Loading announcements...');
      console.log('Query: classroom_announcements, classroom_id =', id);
      try {
        const {
          data: announcementsData,
          error: announcementsError
        } = await supabase.from('classroom_announcements').select('*').eq('classroom_id', id).order('created_at', {
          ascending: false
        });
        if (announcementsError) {
          console.error('❌ ANNOUNCEMENTS QUERY FAILED');
          console.error('Error code:', announcementsError.code);
          console.error('Error message:', announcementsError.message);
          console.error('Error details:', announcementsError.details);
          console.error('Error hint:', announcementsError.hint);
          console.error('Full error object:', JSON.stringify(announcementsError, null, 2));
          throw announcementsError;
        }
        console.log('✅ Announcements loaded:', announcementsData?.length || 0, 'announcements');
        setAnnouncements(announcementsData || []);
      } catch (err: any) {
        console.error('❌ FATAL: Announcements query exception:', err);
        throw err;
      }

      // Query 5: Load flashcard sets
      console.log('\n🎴 Step 6: Loading flashcard sets...');
      console.log('Query: flashcard_sets, classroom_id =', id);
      try {
        let flashcardsQuery = supabase.from('flashcard_sets').select(`
            *,
            question_groups!question_group_id (title, subject, grade)
          `).eq('classroom_id', id);

        // Students only see posted flashcard sets
        if (classroomData?.teacher_id !== session.user.id) {
          flashcardsQuery = flashcardsQuery.eq('is_posted', true);
        }
        const {
          data: flashcardsData,
          error: flashcardsError
        } = await flashcardsQuery.order('created_at', {
          ascending: false
        });
        if (flashcardsError) {
          console.error('❌ FLASHCARDS QUERY FAILED');
          console.error('Error code:', flashcardsError.code);
          console.error('Error message:', flashcardsError.message);
          console.error('Error details:', flashcardsError.details);
          console.error('Error hint:', flashcardsError.hint);
          console.error('Full error object:', JSON.stringify(flashcardsError, null, 2));
          throw flashcardsError;
        }
        console.log('✅ Flashcard sets loaded:', flashcardsData?.length || 0, 'sets');
        setFlashcardSets(flashcardsData || []);
      } catch (err: any) {
        console.error('❌ FATAL: Flashcards query exception:', err);
        throw err;
      }

      // Query 6: Load parent access requests (teachers only)
      // Check using the just-loaded classroom data, not the state
      if (classroomData?.teacher_id === session.user.id) {
        console.log('\n👨‍👩‍👧 Step 7: Loading parent access requests...');
        console.log('Query: parent_access_requests, classroom_id =', id);
        try {
          const {
            data: requestsData,
            error: requestsError
          } = await supabase.from('parent_access_requests').select(`
              *,
              parent_accounts!parent_id (full_name, email)
            `).eq('classroom_id', id).order('created_at', {
            ascending: false
          });
          if (requestsError) {
            console.error('❌ PARENT REQUESTS QUERY FAILED');
            console.error('Error code:', requestsError.code);
            console.error('Error message:', requestsError.message);
            console.error('Error details:', requestsError.details);
            console.error('Error hint:', requestsError.hint);
            console.error('Full error object:', JSON.stringify(requestsError, null, 2));
            throw requestsError;
          }

          // Manually fetch student names for each request
          const enrichedRequests = await Promise.all((requestsData || []).map(async (request: any) => {
            const {
              data: studentData
            } = await supabase.from('profiles').select('full_name').eq('id', request.student_id).single();
            return {
              ...request,
              profiles: studentData
            };
          }));
          console.log('✅ Parent requests loaded:', enrichedRequests.length, 'requests');
          setParentRequests(enrichedRequests);
        } catch (err: any) {
          console.error('❌ FATAL: Parent requests query exception:', err);
          throw err;
        }
      } else {
        console.log('\n⏭️ Step 7: Skipping parent requests (not teacher or no classroom)');
      }
      console.log('\n🎉 ============================================');
      console.log('🎉 ALL DATA LOADED SUCCESSFULLY!');
      console.log('🎉 ============================================');
    } catch (error: any) {
      console.error('\n💥 ============================================');
      console.error('💥 FATAL ERROR IN loadClassroomData');
      console.error('💥 ============================================');
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('Full error:', error);
      console.error('💥 ============================================');
      toast({
        title: "Error",
        description: `Failed to load classroom data: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      console.log('🏁 loadClassroomData: FINISHED (loading=false)');
    }
  };
  const copyJoinCode = () => {
    if (classroom?.join_code) {
      navigator.clipboard.writeText(classroom.join_code);
      toast({
        title: "Copied!",
        description: "Join code copied to clipboard"
      });
    }
  };
  const handleToggleAssignmentStatus = (assignmentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    toggleAssignmentStatus({
      id: assignmentId,
      newStatus: newStatus as 'draft' | 'published'
    });
  };
  const handleApproveParentRequest = async (requestId: string) => {
    try {
      const {
        error
      } = await supabase.from('parent_access_requests').update({
        status: 'approved',
        resolved_at: new Date().toISOString()
      }).eq('id', requestId);
      if (error) throw error;
      toast({
        title: "Request Approved",
        description: "Parent can now view their child's progress"
      });
      loadClassroomData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive"
      });
    }
  };
  const handleDenyParentRequest = async (requestId: string) => {
    try {
      const {
        error
      } = await supabase.from('parent_access_requests').update({
        status: 'denied',
        resolved_at: new Date().toISOString()
      }).eq('id', requestId);
      if (error) throw error;
      toast({
        title: "Request Denied",
        description: "Parent access request has been denied"
      });
      loadClassroomData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to deny request",
        variant: "destructive"
      });
    }
  };
  const handleDeleteTournament = async (tournamentId: string) => {
    try {
      const {
        error
      } = await supabase.from('tournaments').delete().eq('id', tournamentId);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Tournament deleted successfully"
      });
      loadClassroomData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tournament",
        variant: "destructive"
      });
    }
  };
  if (isLoading || permissionsLoading) {
    return <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  if (!isTeacher && !isStudent) {
    return <div className="min-h-screen flex flex-col">
        <Header showAuthButtons={false} />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-4">You don't have permission to view this classroom</p>
            <Button onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>;
  }
  if (!classroom) {
    return <div className="min-h-screen flex flex-col">
        <Header showAuthButtons={false} />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Classroom Not Found</h1>
            <Button onClick={() => navigate('/teacher/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </main>
        <Footer />
      </div>;
  }
  return <div className="min-h-screen flex flex-col">
      <Header showAuthButtons={false} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={isTeacher ? "/teacher/dashboard" : "/student/dashboard"}>
                    Dashboard
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{classroom.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Enhanced Classroom Header */}
          <Card className="mb-8 shadow-elegant border-2 border-primary/10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
            <CardHeader className="bg-gradient-to-br from-muted/30 to-muted/10 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                    {classroom.name}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span className="font-medium">
                        {students.length} student{students.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                {isTeacher && <div className="flex flex-col items-center gap-1">
                  <span className="text-sm text-muted-foreground font-medium">Join Code</span>
                  <Badge variant="outline" className="font-mono text-xl px-6 py-3 border-2 border-primary/30 bg-background/80 backdrop-blur-sm">
                    {classroom.join_code}
                  </Badge>
                </div>}
              </div>
            </CardHeader>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center gap-3 flex-wrap">
                {isTeacher && <>
                    <Button variant="outline" size="lg" onClick={copyJoinCode} className="hover:bg-primary/5 hover:border-primary/30">
                      <Copy className="mr-2 h-5 w-5" />
                      Copy Join Code
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => setShowEditClassroom(true)} className="hover:bg-primary/5 hover:border-primary/30">
                      Edit Classroom
                    </Button>
                    <Button size="lg" onClick={() => setShowClassGlance(true)} className="bg-gradient-primary hover:opacity-90 shadow-card text-base">
                      <BarChart3 className="mr-2 h-5 w-5" />
                      🧠 AI Class Insights
                    </Button>
                  </>}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Section */}
          {isTeacher && <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border-2 border-primary/10 shadow-card">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Quick Actions</h2>
                  <p className="text-sm text-muted-foreground">Manage your classroom content and activities</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="lg" onClick={() => navigate(`/teacher/questions/${id}`)} className="hover:bg-primary/5 hover:border-primary/30">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Manage Questions
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => navigate(`/teacher/assignment/create/${id}`)} className="hover:bg-secondary/5 hover:border-secondary/30">
                    <FileText className="mr-2 h-5 w-5" />
                    Create Assignment
                  </Button>
                  <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-card" onClick={() => setShowCreateAnnouncement(true)}>
                    <Megaphone className="mr-2 h-5 w-5" />
                    Send Announcement
                  </Button>
                </div>
              </div>
            </div>}

          <Tabs defaultValue={searchParams.get('tab') || (isStudent ? "assignments" : "students")} className="mb-8">
            <TabsList className={cn("grid w-full h-auto p-2 bg-muted/50 rounded-xl", isTeacher ? "grid-cols-5 gap-2" : "grid-cols-3 gap-2")}>
              {/* Teacher Top Row: Syllabus, Attendance, Assignments, Announcements, Students */}
              {isTeacher && <>
                  <TabsTrigger value="syllabus" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card py-1.5 px-4 rounded-lg transition-all">
                    <FileText className="mr-2 h-4 w-4" />
                    Syllabus
                  </TabsTrigger>
                  <TabsTrigger value="attendance" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card py-1.5 px-4 rounded-lg transition-all">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Attendance
                  </TabsTrigger>
                  <TabsTrigger value="safety" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card py-1.5 px-4 rounded-lg transition-all">
                    <Shield className="mr-2 h-4 w-4" />
                    Safety
                  </TabsTrigger>
                  <TabsTrigger value="behavior" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card py-1.5 px-4 rounded-lg transition-all">
                    <Trophy className="mr-2 h-4 w-4" />
                    Behavior
                  </TabsTrigger>
                  <TabsTrigger value="assignments" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card py-1.5 px-4 rounded-lg transition-all">
                    <FileText className="mr-2 h-4 w-4" />
                    Assignments
                  </TabsTrigger>
                  <TabsTrigger value="announcements" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card py-1.5 px-4 rounded-lg transition-all">
                    <Megaphone className="mr-2 h-4 w-4" />
                    Announcements
                  </TabsTrigger>
                  <TabsTrigger value="students" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card py-1.5 px-4 rounded-lg transition-all">
                    <Users className="mr-2 h-4 w-4" />
                    Students
                  </TabsTrigger>
                  {/* Teacher Bottom Row: Leaderboard, Study Materials, Tournaments, AI Insights, Parent Requests */}
                  <TabsTrigger value="leaderboard" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card py-1.5 px-4 rounded-lg transition-all">
                    <Trophy className="mr-2 h-4 w-4" />
                    Leaderboard
                  </TabsTrigger>
                  <TabsTrigger value="study" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card py-1.5 px-4 rounded-lg transition-all">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Study Materials
                  </TabsTrigger>
                  <TabsTrigger value="tournaments" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card py-1.5 px-4 rounded-lg transition-all">
                    <Trophy className="mr-2 h-4 w-4" />
                    Study Games
                  </TabsTrigger>
                  <TabsTrigger value="ai-insights" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card py-1.5 px-4 rounded-lg transition-all">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    AI Insights
                  </TabsTrigger>
                  <TabsTrigger value="parent-requests" className="relative data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card py-1.5 px-4 rounded-lg transition-all">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Parent Requests
                    {parentRequests.filter(r => r.status === 'pending').length > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                        {parentRequests.filter(r => r.status === 'pending').length}
                      </Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="discussions" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card py-1.5 px-4 rounded-lg transition-all">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Discussions
                  </TabsTrigger>
                  <TabsTrigger value="rubrics" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card py-1.5 px-4 rounded-lg transition-all">
                    <Grid3X3 className="mr-2 h-4 w-4" />
                    Rubrics
                  </TabsTrigger>
                </>}
              {/* Student Tabs: Row 1: Syllabus, Assignments, Announcements; Row 2: Study Materials, Tournaments, Trends */}
              {!isTeacher && <>
                  <TabsTrigger value="syllabus" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card py-1.5 px-4 rounded-lg transition-all">
                    <FileText className="mr-2 h-4 w-4" />
                    Syllabus
                  </TabsTrigger>
                  <TabsTrigger value="assignments" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card py-1.5 px-4 rounded-lg transition-all">
                    <FileText className="mr-2 h-4 w-4" />
                    Assignments
                  </TabsTrigger>
                  <TabsTrigger value="announcements" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card py-1.5 px-4 rounded-lg transition-all">
                    <Megaphone className="mr-2 h-4 w-4" />
                    Announcements
                  </TabsTrigger>
                  <TabsTrigger value="study" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card py-1.5 px-4 rounded-lg transition-all">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Study Materials
                  </TabsTrigger>
                  <TabsTrigger value="tournaments" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card py-1.5 px-4 rounded-lg transition-all">
                    <Trophy className="mr-2 h-4 w-4" />
                    Study Games
                  </TabsTrigger>
                  <TabsTrigger value="trends" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card py-1.5 px-4 rounded-lg transition-all">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Trends
                  </TabsTrigger>
                  <TabsTrigger value="discussions" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card py-1.5 px-4 rounded-lg transition-all">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Discussions
                  </TabsTrigger>
                </>}
            </TabsList>

            {isTeacher && <TabsContent value="students" className="mt-6">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Student Roster</h2>
                  <p className="text-muted-foreground mt-1">Manage and view your classroom students</p>
                </div>

              {students.length === 0 ? <Card className="p-16 text-center shadow-elegant border-2 border-primary/10 bg-gradient-to-br from-background to-muted/20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-primary/10 flex items-center justify-center">
                <Users className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">No Students Yet</h3>
              <p className="text-muted-foreground mb-6 text-lg">
                Share the join code with your students to get started
              </p>
              {isTeacher && <div className="flex flex-col items-center gap-2">
                <span className="text-sm text-muted-foreground font-medium">Join Code</span>
                <Badge variant="outline" className="font-mono text-2xl px-6 py-3 border-2 border-primary/30">
                  {classroom.join_code}
                </Badge>
              </div>}
            </Card> : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map(student => <Card key={student.id} className="shadow-card hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] border-2 border-primary/10 hover:border-primary/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">{student.profiles?.full_name || 'Student'}</CardTitle>
                    {student.profiles?.email && <p className="text-sm text-muted-foreground">{student.profiles.email}</p>}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {student.student_profiles?.[0]?.grade && <Badge variant="secondary" className="text-base px-3 py-1">
                        📚 Grade {student.student_profiles[0].grade}
                      </Badge>}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Joined {new Date(student.joined_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>)}
                </div>}
              </TabsContent>}

            {isTeacher && <TabsContent value="attendance" className="mt-6">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Attendance</h2>
                  <p className="text-muted-foreground mt-1">Track and manage student attendance</p>
                </div>
                <AttendanceTab classroomId={id!} students={students.map(s => ({
              student_id: s.student_id,
              full_name: s.profiles?.full_name || 'Student',
              avatar_url: s.student_profiles?.[0]?.avatar_url
            }))} />
              </TabsContent>}

            {isTeacher && <TabsContent value="safety" className="mt-6">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Safety & Drills</h2>
                  <p className="text-muted-foreground mt-1">Manage emergency drills and student safety</p>
                </div>
                <TeacherSafetyTab classroomId={id!} students={students} />
              </TabsContent>}

            {isTeacher && <TabsContent value="behavior" className="mt-6">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Behavior Tracking</h2>
                  <p className="text-muted-foreground mt-1">Track and reward student behavior</p>
                </div>
                <TeacherBehaviorTab 
                  classroomId={id!} 
                  students={students.map(s => ({ 
                    id: s.student_id, 
                    full_name: s.profiles?.full_name || 'Unknown'
                  }))} 
                />
              </TabsContent>}

            {isTeacher && <TabsContent value="ai-insights" className="mt-6">
                <ClassroomAIInsights classroomId={id!} />
              </TabsContent>}

            {isTeacher && <TabsContent value="leaderboard" className="mt-6">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Class Leaderboard</h2>
                  <p className="text-muted-foreground mt-1">Track student performance and achievements</p>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                  <LeaderboardCard classroomId={id!} currentStudentId={profile?.id} title="Reading Stars" />
                  <ClassroomLeaderboard classroomId={id!} currentStudentId={isStudent ? profile?.id : undefined} />
                </div>
              </TabsContent>}

            {isStudent && profile && <TabsContent value="trends" className="mt-6">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Your Progress</h2>
                  <p className="text-muted-foreground mt-1">Track your performance trends in this classroom</p>
                </div>
                <StudentClassroomTrends classroomId={id!} studentId={profile.id} />
              </TabsContent>}

            {isTeacher && <TabsContent value="parent-requests" className="mt-6">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold">Parent Access Requests</h2>
                  <p className="text-muted-foreground mt-1">
                    Approve or deny parent requests to view their child's progress
                  </p>
                </div>

                {parentRequests.length === 0 ? <Card className="p-12 text-center">
                    <UserCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-bold mb-2">No Parent Requests</h3>
                    <p className="text-muted-foreground">
                      When parents request access to view their child's progress, they'll appear here
                    </p>
                  </Card> : <div className="grid md:grid-cols-2 gap-6">
                    {parentRequests.map(request => <ParentAccessRequestCard key={request.id} id={request.id} parentName={request.parent_accounts?.full_name || 'Parent'} parentEmail={request.parent_accounts?.email || ''} studentName={request.profiles?.full_name || 'Student'} message={request.message} status={request.status} createdAt={request.created_at} onApprove={handleApproveParentRequest} onDeny={handleDenyParentRequest} />)}
                  </div>}
              </TabsContent>}

            {/* Discussions Tab */}
            <TabsContent value="discussions" className="mt-6">
              <DiscussionBoard classroomId={id!} isTeacher={isTeacher} />
            </TabsContent>

            {/* Rubrics Tab - Teachers Only */}
            {isTeacher && <TabsContent value="rubrics" className="mt-6">
                <RubricsList classroomId={id!} />
              </TabsContent>}

            <TabsContent value="assignments" className="mt-6">
              {isTeacher && <StandardsProgressDashboard classroomId={id!} />}
              
              <div className="mb-4 flex items-center justify-between mt-6">
                <h2 className="text-2xl font-bold">Assignments</h2>
                {isTeacher && <Button className="bg-gradient-primary hover:opacity-90" onClick={() => navigate(`/teacher/assignment/create/${id}`)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Create Assignment
                  </Button>}
              </div>

              {!assignments || assignments.length === 0 ? <Card className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-bold mb-2">No Assignments Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {isTeacher ? 'Create multi-question assignments with various question types' : 'Your teacher hasn\'t posted any assignments yet'}
                  </p>
                  {isTeacher && <Button className="bg-gradient-primary hover:opacity-90" onClick={() => navigate(`/teacher/assignment/create/${id}`)}>
                      <FileText className="mr-2 h-4 w-4" />
                      Create First Assignment
                    </Button>}
                </Card> : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assignments.map((assignment: any) => {
                // Teachers: show all assignments with full controls
                if (isTeacher) {
                  return <Card key={assignment.id} className="shadow-card hover:shadow-purple transition-shadow">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">{assignment.title}</CardTitle>
                                {assignment.assignment_type === 'speaking' && <span title="Speaking Assignment">
                                    <Mic className="h-4 w-4 text-primary" />
                                  </span>}
                                {(assignment.assignment_type === 'reading_comprehension' || assignment.assignment_type === 'multi_question') && <div className="flex items-center gap-1">
                                    <span title="Reading/Questions">
                                      <BookOpen className="h-4 w-4 text-primary" />
                                    </span>
                                    <span title="Includes Speaking">
                                      <Mic className="h-4 w-4 text-primary" />
                                    </span>
                                  </div>}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={assignment.status === 'published' ? 'default' : 'secondary'}>
                                  {assignment.status === 'published' ? <>
                                      <Eye className="h-3 w-3 mr-1" />
                                      Published
                                    </> : <>
                                      <EyeOff className="h-3 w-3 mr-1" />
                                      Draft
                                    </>}
                                </Badge>
                                {assignment.category && <Badge variant="outline" className={getCategoryColor(assignment.category)}>
                                    {assignment.category}
                                  </Badge>}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-background z-50">
                                    <DropdownMenuItem onClick={() => handleToggleAssignmentStatus(assignment.id, assignment.status)}>
                                      {assignment.status === 'published' ? <>
                                          <EyeOff className="mr-2 h-4 w-4" />
                                          Unpublish
                                        </> : <>
                                          <Eye className="mr-2 h-4 w-4" />
                                          Publish
                                        </>}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setDeleteAssignmentId(assignment.id)} className="text-destructive focus:text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {assignment.description && <p className="text-sm text-muted-foreground line-clamp-2">
                                  {assignment.description}
                                </p>}
                              <div className="flex gap-2">
                                <Badge variant="outline">
                                  {assignment.question_count || 1} Question{(assignment.question_count || 1) !== 1 ? 's' : ''}
                                </Badge>
                                {assignment.timer_minutes && <Badge variant="outline">
                                    {assignment.timer_minutes} min
                                  </Badge>}
                              </div>
                              {assignment.due_date && <p className="text-xs text-muted-foreground">
                                  Due: {new Date(assignment.due_date).toLocaleDateString()}
                                </p>}
                              <p className="text-xs text-muted-foreground">
                                Created {new Date(assignment.created_at).toLocaleDateString()}
                              </p>
                              
                              <AssignmentStatsCard assignmentId={assignment.id} />
                              
                              {assignment.status === 'draft' && <Button variant="outline" className="w-full mt-2" onClick={() => navigate(`/teacher/assignment/create/${id}?edit=${assignment.id}`)}>
                                  Edit Draft
                                </Button>}
                              
                              {assignment.status === 'published' && <Button variant="outline" className="w-full mt-4" onClick={() => setViewingAssignmentId(assignment.id)}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  View Submissions
                                </Button>}
                            </div>
                          </CardContent>
                        </Card>;
                }

                // Students: only show published assignments in student view
                if (isStudent && assignment.status === 'published') {
                  return <StudentAssignmentCard key={assignment.id} assignment={assignment} classroomId={id!} />;
                }

                // Fail-safe: if role is unclear, show nothing
                return null;
              })}
                </div>}
            </TabsContent>

            <TabsContent value="announcements" className="mt-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold">Announcements & Assignments</h2>
              </div>

              {announcements.length === 0 ? <Card className="p-12 text-center">
                  <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-bold mb-2">No Announcements Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {isTeacher ? 'Send messages and assignments to all students in this classroom' : 'Your teacher hasn\'t posted any announcements yet'}
                  </p>
                  {isTeacher && <Button className="bg-gradient-primary hover:opacity-90" onClick={() => setShowCreateAnnouncement(true)}>
                      <Megaphone className="mr-2 h-4 w-4" />
                      Send to Students
                    </Button>}
                </Card> : <div className="space-y-4">
                  {announcements.map(announcement => <AnnouncementCard key={announcement.id} title={announcement.title} content={announcement.content} type={announcement.announcement_type} createdAt={announcement.created_at} />)}
                </div>}
            </TabsContent>

            <TabsContent value="tournaments" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Study Games </h2>
                {isTeacher && <Button className="bg-gradient-primary hover:opacity-90" onClick={() => setShowSelectGame(true)}>
                    <Trophy className="mr-2 h-4 w-4" />
                    Create Tournament
                  </Button>}
              </div>

              {tournaments.length === 0 ? <Card className="p-12 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-bold mb-2">No Tournaments Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {isTeacher ? 'Create your first TriviaTastic tournament for this classroom' : 'Your teacher hasn\'t created any tournaments yet'}
                  </p>
                  {isTeacher && <Button className="bg-gradient-primary hover:opacity-90" onClick={() => setShowSelectGame(true)}>
                      <Trophy className="mr-2 h-4 w-4" />
                      Create Tournament
                    </Button>}
                </Card> : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tournaments.map(tournament => <Card key={tournament.id} className="shadow-card hover:shadow-purple transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{tournament.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={tournament.status === 'completed' ? 'secondary' : tournament.status === 'in_progress' ? 'default' : 'outline'}>
                              {tournament.status}
                            </Badge>
                            {isTeacher && <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setDeleteTournamentId(tournament.id)} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Game created
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(tournament.created_at).toLocaleDateString()}
                          </p>
                          <Button variant="outline" className="w-full mt-4" onClick={() => {
                      if (isTeacher) {
                        navigate(`/teacher/tournament/control?tournament=${tournament.id}`);
                      } else {
                        navigate(`/games/jeopardy-1v1?tournament=${tournament.id}`);
                      }
                    }}>
                            <Play className="mr-2 h-4 w-4" />
                            {isTeacher ? 'Control Tournament' : 'Join Game'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>)}
                </div>}
            </TabsContent>

            <TabsContent value="study" className="mt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Study Materials</h2>
                  <p className="text-muted-foreground">
                    {isTeacher ? "Manage flashcard sets for your students" : "Review flashcard sets from your teacher"}
                  </p>
                </div>
                {isTeacher && <Button onClick={() => navigate(`/teacher/questions/${id}`)} className="bg-gradient-primary">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Flashcards
                  </Button>}
              </div>

              {viewingFlashcardSet ? <div>
                  <Button variant="outline" onClick={() => setViewingFlashcardSet(null)} className="mb-4">
                    ← Back to Study Materials
                  </Button>
                  <FlashcardSetViewer flashcards={viewingFlashcardSet.flashcards} />
                </div> : flashcardSets.length === 0 ? <Card className="p-12 text-center">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-bold mb-2">No Study Materials Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {isTeacher ? "Generate flashcard sets from your question groups" : "Your teacher hasn't created any flashcard sets yet"}
                  </p>
                  {isTeacher && <Button onClick={() => navigate(`/teacher/questions/${id}`)} className="bg-gradient-primary">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Flashcard Set
                    </Button>}
                </Card> : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {flashcardSets.map(set => <Card key={set.id} className="shadow-card hover:shadow-purple transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{set.title}</CardTitle>
                          {isTeacher && <Badge variant={set.is_posted ? "default" : "secondary"}>
                              {set.is_posted ? "Posted" : "Draft"}
                            </Badge>}
                        </div>
                        {set.description && <p className="text-sm text-muted-foreground line-clamp-2">
                            {set.description}
                          </p>}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {set.question_groups?.subject && <Badge variant="secondary">{set.question_groups.subject}</Badge>}
                            {set.question_groups?.grade !== undefined && <Badge variant="outline">
                                {set.question_groups.grade === 0 ? "K" : `Grade ${set.question_groups.grade}`}
                              </Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <strong>{set.flashcards.length}</strong> flashcards
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(set.created_at).toLocaleDateString()}
                          </p>
                          <div className="flex gap-2">
                            <Button className="flex-1 bg-gradient-primary" onClick={() => setViewingFlashcardSet(set)}>
                              <Play className="mr-2 h-4 w-4" />
                              Study Now
                            </Button>
                            {isTeacher && <Button variant={set.is_posted ? "outline" : "default"} onClick={async () => {
                        try {
                          const {
                            error
                          } = await supabase.from('flashcard_sets').update({
                            is_posted: !set.is_posted
                          }).eq('id', set.id);
                          if (error) throw error;
                          toast({
                            title: "Success",
                            description: `Flashcard set ${!set.is_posted ? 'posted' : 'unpublished'}`
                          });
                          loadClassroomData();
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: "Failed to update flashcard set status",
                            variant: "destructive"
                          });
                        }
                      }}>
                                {set.is_posted ? "Unpost" : "Post"}
                              </Button>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>)}
                </div>}
            </TabsContent>

            <TabsContent value="syllabus" className="mt-6">
              <SyllabusTab classroomId={id!} isTeacher={isTeacher} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {isTeacher && <>
          <SelectGameModal open={showSelectGame} onOpenChange={setShowSelectGame} onSelectGame={gameType => {
        setSelectedGameType(gameType);
        setShowCreateTournament(true);
      }} />

          <CreateTournamentModal open={showCreateTournament} onOpenChange={setShowCreateTournament} classroomId={id!} gameType={selectedGameType} />

          <CreateAnnouncementModal open={showCreateAnnouncement} onOpenChange={setShowCreateAnnouncement} classroomId={id!} onSuccess={loadClassroomData} />

          <CreateAssignmentModal open={showCreateAssignment} onOpenChange={setShowCreateAssignment} classroomId={id!} onSuccess={loadClassroomData} />

          {viewingAssignmentId && <Dialog open={!!viewingAssignmentId} onOpenChange={open => !open && setViewingAssignmentId(null)}>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Student Submissions</DialogTitle>
                  <DialogDescription>
                    Review and grade student work for this assignment
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <SubmissionsList submissions={assignmentSubmissions} classroomId={id!} assignmentType={assignments.find((a: any) => a.id === viewingAssignmentId)?.assignment_type || 'multi_question'} />
                </div>
              </DialogContent>
            </Dialog>}

          {/* Class at a Glance Dialog */}
          <Dialog open={showClassGlance} onOpenChange={setShowClassGlance}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Your Class at a Glance - {classroom?.name}</DialogTitle>
              </DialogHeader>
              <TeacherSuccessBoard classroomId={id!} />
            </DialogContent>
          </Dialog>

          <ConfirmModal open={!!deleteAssignmentId} onOpenChange={open => !open && setDeleteAssignmentId(null)} title="Delete Assignment" description="Are you sure you want to delete this assignment? This action cannot be undone." confirmText="Yes" cancelText="No" onConfirm={() => {
        if (deleteAssignmentId) {
          deleteAssignment(deleteAssignmentId);
          setDeleteAssignmentId(null);
        }
      }} />

          <ConfirmModal open={!!deleteTournamentId} onOpenChange={open => !open && setDeleteTournamentId(null)} title="Delete Tournament" description="Are you sure you want to delete this tournament? This will also delete all associated matches and player data. This action cannot be undone." confirmText="Yes, Delete" cancelText="Cancel" onConfirm={() => {
        if (deleteTournamentId) {
          handleDeleteTournament(deleteTournamentId);
          setDeleteTournamentId(null);
        }
      }} />

          <EditClassroomModal open={showEditClassroom} onOpenChange={setShowEditClassroom} onSuccess={loadClassroomData} classroom={classroom} />
        </>}
    </div>;
};
export default ClassroomDetail;