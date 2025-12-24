import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Copy, Trophy, Play, Megaphone, BookOpen, GraduationCap, FileText, MoreVertical, Trash2, Mic, Eye, EyeOff, UserCheck, BarChart3, Calendar, Plus, Shield, MessageSquare, Grid3X3, BookHeart, UserPlus, Clock, AlertCircle } from "lucide-react";
import { SubstituteAccessModal } from "@/components/teacher/SubstituteAccessModal";
import { TeacherJournalTab } from "@/components/teacher/TeacherJournalTab";
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
import { SingleClassroomGradebook } from "@/components/student/SingleClassroomGradebook";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import { SyllabusTab } from "@/components/classroom/SyllabusTab";
import { StandardsProgressDashboard } from "@/components/classroom/StandardsProgressDashboard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TeacherSafetyTab } from "@/components/teacher/TeacherSafetyTab";
import { TeacherBehaviorTab } from "@/components/behavior/TeacherBehaviorTab";
import { ToolkitSidebar } from "@/components/classroom/ToolkitSidebar";
import { useClassroomFeatures } from "@/hooks/useClassroomFeatures";
import { ClassroomTabsList } from "@/components/classroom/ClassroomTabsList";
import { MeetingRequestsTab } from "@/components/teacher/MeetingRequestsTab";
import { PendingStudentRequests } from "@/components/classroom/PendingStudentRequests";
import { 
  useClassroomDetail, 
  useClassroomStudents, 
  useClassroomTournaments, 
  useClassroomAnnouncements, 
  useClassroomParentRequests,
  useClassroomFlashcards,
  useUserProfile
} from "@/hooks/useClassroomData";
const ClassroomDetail = () => {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    toast
  } = useToast();
  const { session, user } = useAuth();
  const {
    isTeacher,
    isStudent,
    isLoading: permissionsLoading
  } = useClassroomPermissions(id);

  // React Query hooks for cached data fetching
  const { data: classroomData, isLoading: classroomLoading, refetch: refetchClassroom } = useClassroomDetail(id);
  const { data: studentsData = [], refetch: refetchStudents } = useClassroomStudents(id);
  const { data: tournamentsData = [], refetch: refetchTournaments } = useClassroomTournaments(id);
  const { data: announcementsData = [], refetch: refetchAnnouncements } = useClassroomAnnouncements(id);
  const { data: parentRequestsData = [], refetch: refetchParentRequests } = useClassroomParentRequests(id, isTeacher);
  const { data: flashcardSetsData = [], refetch: refetchFlashcards } = useClassroomFlashcards(id, isTeacher);
  const { data: profileData } = useUserProfile();

  // Refetch all classroom data
  const loadClassroomData = () => {
    refetchClassroom();
    refetchStudents();
    refetchTournaments();
    refetchAnnouncements();
    refetchParentRequests();
    refetchFlashcards();
  };

  // Substitute teacher state (separate from cached data)
  const [substituteAccess, setSubstituteAccess] = useState<{
    classroomId: string;
    permissions: Record<string, boolean>;
    accessEnd: string;
    substituteName: string;
    email: string;
    linkId: string;
  } | null>(null);
  const [substituteAssignments, setSubstituteAssignments] = useState<any[]>([]);
  const [substituteClassroom, setSubstituteClassroom] = useState<any>(null);
  const [substituteStudents, setSubstituteStudents] = useState<any[]>([]);
  const [substituteAnnouncements, setSubstituteAnnouncements] = useState<any[]>([]);
  const [substituteLoading, setSubstituteLoading] = useState(false);

  // Use substitute data if available, otherwise use React Query data
  const classroom = substituteAccess ? substituteClassroom : classroomData;
  const students = substituteAccess ? substituteStudents : studentsData;
  const tournaments = tournamentsData;
  const announcements = substituteAccess ? substituteAnnouncements : announcementsData;
  const parentRequests = parentRequestsData;
  const flashcardSets = flashcardSetsData;
  const profile = profileData;
  const isLoading = substituteAccess ? substituteLoading : (classroomLoading || permissionsLoading);

  // UI state
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [showSelectGame, setShowSelectGame] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState<string>('jeopardy_duel');
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [viewingAssignmentId, setViewingAssignmentId] = useState<string | null>(null);
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
  const [studentToRemove, setStudentToRemove] = useState<any>(null);
  const [showRemoveStudentModal, setShowRemoveStudentModal] = useState(false);
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
  const { isFeatureEnabled } = useClassroomFeatures(id);

  // Load classroom data for substitute teachers (no auth required)
  const loadClassroomDataForSubstitute = async (accessData: typeof substituteAccess) => {
    if (!accessData || !id) return;
    
    setSubstituteLoading(true);
    console.log('🔍 Loading classroom data for substitute teacher...');
    try {
      const { data: classroomResult, error: classroomError } = await supabase.rpc('get_classroom_for_substitute', {
        p_classroom_id: id,
        p_link_id: accessData.linkId
      });

      if (classroomError || !classroomResult || classroomResult.length === 0) {
        console.error('Failed to load classroom for substitute:', classroomError);
        sessionStorage.removeItem('substituteAccess');
        toast({
          title: "Access Error",
          description: "Unable to access classroom. Your link may have expired.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      setSubstituteClassroom(classroomResult[0]);

      if (accessData.permissions.view_students) {
        const { data: studentsResult } = await supabase.rpc('get_students_for_substitute', {
          p_classroom_id: id,
          p_link_id: accessData.linkId
        });
        if (studentsResult) {
          setSubstituteStudents(studentsResult.map((student: any) => ({
            student_id: student.student_id,
            joined_at: student.joined_at,
            profiles: { id: student.student_id, full_name: student.full_name, email: student.email },
            student_profiles: []
          })));
        }
      }

      if (accessData.permissions.view_assignments) {
        const { data: assignmentsResult } = await supabase.rpc('get_assignments_for_substitute', {
          p_classroom_id: id,
          p_link_id: accessData.linkId
        });
        if (assignmentsResult) setSubstituteAssignments(assignmentsResult);
      }

      const { data: announcementsResult } = await supabase
        .from('classroom_announcements')
        .select('*')
        .eq('classroom_id', id)
        .order('created_at', { ascending: false });
      setSubstituteAnnouncements(announcementsResult || []);
    } catch (err) {
      console.error('Error loading substitute data:', err);
    } finally {
      setSubstituteLoading(false);
    }
  };

  // Check for substitute access on mount
  useEffect(() => {
    if (!id) return;
    
    const storedAccess = sessionStorage.getItem('substituteAccess');
    if (storedAccess) {
      try {
        const accessData = JSON.parse(storedAccess);
        if (accessData.classroomId === id) {
          const accessEnd = new Date(accessData.accessEnd);
          if (accessEnd > new Date()) {
            setSubstituteAccess(accessData);
            loadClassroomDataForSubstitute(accessData);
            return;
          }
        }
      } catch (e) {
        sessionStorage.removeItem('substituteAccess');
      }
    }
    
    // Redirect if no session and not substitute
    if (!permissionsLoading && !session && !substituteAccess) {
      navigate('/auth', { replace: true });
    }
  }, [id, permissionsLoading, session]);
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
  
  const handleRemoveStudent = async () => {
    if (!studentToRemove) return;
    
    try {
      const { error } = await supabase
        .from('classroom_students')
        .delete()
        .eq('id', studentToRemove.id);
      
      if (error) throw error;
      
      toast({
        title: "Student Removed",
        description: `${studentToRemove.profiles?.full_name || 'Student'} has been removed from the class`
      });
      
      setShowRemoveStudentModal(false);
      setStudentToRemove(null);
      loadClassroomData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove student",
        variant: "destructive"
      });
    }
  };
  if (isLoading || permissionsLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  // Check if user has access (teacher, student, or substitute)
  const isSubstitute = substituteAccess !== null && substituteAccess.classroomId === id;
  // Substitutes should see teacher UI, not student UI
  const canViewAsTeacher = isTeacher || isSubstitute;
  const hasAccess = isTeacher || isStudent || isSubstitute;
  
  // Use substitute-loaded assignments when in substitute mode, otherwise use hook assignments
  const effectiveAssignments = isSubstitute ? substituteAssignments : (assignments || []);
  
  if (!hasAccess) {
    return <div className="min-h-screen flex flex-col bg-background">
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
    return <div className="min-h-screen flex flex-col bg-background">
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
  // Calculate time remaining for substitute access
  const getTimeRemaining = () => {
    if (!substituteAccess) return null;
    const end = new Date(substituteAccess.accessEnd);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes} minutes remaining`;
  };

  const handleEndSubstituteSession = () => {
    sessionStorage.removeItem('substituteAccess');
    toast({
      title: "Session Ended",
      description: "You have been logged out of substitute access.",
    });
    navigate('/auth');
  };

  return <div className="min-h-screen flex flex-col bg-background">
      <Header showAuthButtons={false} />
      
      {/* Substitute Teacher Banner */}
      {isSubstitute && (
        <div className="bg-amber-500/20 border-b border-amber-500/30">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/30 rounded-lg">
                  <UserCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Substitute Teacher Mode
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Welcome, {substituteAccess?.substituteName || 'Substitute'}! 
                    <span className="ml-2 inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {getTimeRemaining()}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-300 bg-amber-500/10">
                  {substituteAccess?.permissions.view_students && "View Students"}
                  {substituteAccess?.permissions.take_attendance && " • Attendance"}
                  {substituteAccess?.permissions.view_assignments && " • Assignments"}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEndSubstituteSession}
                  className="border-amber-500/50 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
                >
                  End Session
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={copyJoinCode}
                      className="p-1.5 rounded-md hover:bg-primary/10 transition-colors"
                      title="Copy join code"
                    >
                      <Copy className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </button>
                    <Badge variant="outline" className="font-mono text-xl px-6 py-3 border-2 border-primary/30 bg-background/80 backdrop-blur-sm">
                      {classroom.join_code}
                    </Badge>
                  </div>
                </div>}
              </div>
            </CardHeader>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center gap-3 flex-wrap">
                {isTeacher && <>
                    <Button variant="outline" size="lg" onClick={() => setShowEditClassroom(true)} className="hover:bg-primary/5 hover:border-primary/30">
                      Edit Classroom
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => setShowEditClassroom(true)} className="hover:bg-primary/5 hover:border-primary/30">
                      Edit Classroom
                    </Button>
                    <ToolkitSidebar classroomId={id!} />
                    <Button size="lg" onClick={() => setShowClassGlance(true)} className="bg-gradient-primary hover:opacity-90 shadow-card text-base">
                      <BarChart3 className="mr-2 h-5 w-5" />
                      🧠 AI Class Insights
                    </Button>
                    <SubstituteAccessModal classroomId={id!} classroomName={classroom.name} />
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

          <Tabs defaultValue={searchParams.get('tab') || (isStudent && !isSubstitute ? "assignments" : "students")} className="mb-8">
            <ClassroomTabsList 
              classroomId={id!}
              isTeacher={canViewAsTeacher}
              parentRequests={parentRequests}
            />

            {canViewAsTeacher && <TabsContent value="students" className="mt-6">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Student Roster</h2>
                  <p className="text-muted-foreground mt-1">Manage and view your classroom students</p>
                </div>
                
                {/* Pending Student Join Requests */}
                <PendingStudentRequests classroomId={id!} onApproved={loadClassroomData} />

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
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{student.profiles?.full_name || 'Student'}</CardTitle>
                        {student.profiles?.email && <p className="text-sm text-muted-foreground">{student.profiles.email}</p>}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setStudentToRemove(student);
                              setShowRemoveStudentModal(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove from Class
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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

            {canViewAsTeacher && substituteAccess?.permissions?.take_attendance !== false && <TabsContent value="attendance" className="mt-6">
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

            {canViewAsTeacher && <TabsContent value="safety" className="mt-6">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Safety & Drills</h2>
                  <p className="text-muted-foreground mt-1">Manage emergency drills and student safety</p>
                </div>
                <TeacherSafetyTab classroomId={id!} students={students} />
              </TabsContent>}

            {canViewAsTeacher && isFeatureEnabled("behavior") && <TabsContent value="behavior" className="mt-6">
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

            {canViewAsTeacher && isFeatureEnabled("ai-insights") && <TabsContent value="ai-insights" className="mt-6">
                <ClassroomAIInsights classroomId={id!} />
              </TabsContent>}

            {canViewAsTeacher && isFeatureEnabled("leaderboard") && <TabsContent value="leaderboard" className="mt-6">
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

            {canViewAsTeacher && <TabsContent value="meeting-requests" className="mt-6">
                <MeetingRequestsTab classroomId={id!} />
              </TabsContent>}

            {/* Discussions Tab */}
            <TabsContent value="discussions" className="mt-6">
              <DiscussionBoard classroomId={id!} isTeacher={canViewAsTeacher} />
            </TabsContent>

            {/* Rubrics Tab - Teachers Only, Toolkit Feature */}
            {canViewAsTeacher && isFeatureEnabled("rubrics") && <TabsContent value="rubrics" className="mt-6">
                <RubricsList classroomId={id!} />
              </TabsContent>}

            {/* Journal Tab - Teachers Only, Toolkit Feature */}
            {canViewAsTeacher && isFeatureEnabled("journal") && <TabsContent value="journal" className="mt-6">
                <TeacherJournalTab classroomId={id} />
              </TabsContent>}

            <TabsContent value="assignments" className="mt-6">
              {canViewAsTeacher && <StandardsProgressDashboard classroomId={id!} />}
              
              <div className="mb-4 flex items-center justify-between mt-6">
                <h2 className="text-2xl font-bold">Assignments</h2>
                {isTeacher && <Button className="bg-gradient-primary hover:opacity-90" onClick={() => navigate(`/teacher/assignment/create/${id}`)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Create Assignment
                  </Button>}
              </div>

              {!effectiveAssignments || effectiveAssignments.length === 0 ? <Card className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-bold mb-2">No Assignments Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {canViewAsTeacher ? 'Create multi-question assignments with various question types' : 'Your teacher hasn\'t posted any assignments yet'}
                  </p>
                  {isTeacher && <Button className="bg-gradient-primary hover:opacity-90" onClick={() => navigate(`/teacher/assignment/create/${id}`)}>
                      <FileText className="mr-2 h-4 w-4" />
                      Create First Assignment
                    </Button>}
                </Card> : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {effectiveAssignments.map((assignment: any) => {
                // Teachers: show all assignments with full controls
                if (canViewAsTeacher) {
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
                                {isTeacher && <DropdownMenu>
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
                                </DropdownMenu>}
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
                              
                              {isTeacher && assignment.status === 'draft' && <Button variant="outline" className="w-full mt-2" onClick={() => navigate(`/teacher/assignment/create/${id}?edit=${assignment.id}`)}>
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
                    {canViewAsTeacher ? 'Send messages and assignments to all students in this classroom' : 'Your teacher hasn\'t posted any announcements yet'}
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
                    {canViewAsTeacher ? 'Create your first TriviaTastic tournament for this classroom' : 'Your teacher hasn\'t created any tournaments yet'}
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
                      if (canViewAsTeacher) {
                        navigate(`/teacher/tournament/control?tournament=${tournament.id}`);
                      } else {
                        navigate(`/games/jeopardy-1v1?tournament=${tournament.id}`);
                      }
                    }}>
                            <Play className="mr-2 h-4 w-4" />
                            {canViewAsTeacher ? 'Control Tournament' : 'Join Game'}
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
                    {canViewAsTeacher ? "Manage flashcard sets for your students" : "Review flashcard sets from your teacher"}
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
                    {canViewAsTeacher ? "Generate flashcard sets from your question groups" : "Your teacher hasn't created any flashcard sets yet"}
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
                          {canViewAsTeacher && <Badge variant={set.is_posted ? "default" : "secondary"}>
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
              <SyllabusTab classroomId={id!} isTeacher={canViewAsTeacher} />
            </TabsContent>

            {/* Student Grades Tab */}
            <TabsContent value="grades" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Your Grades</h2>
                  <p className="text-muted-foreground">
                    View your current grades and performance in this class
                  </p>
                </div>
                {profile?.id && (
                  <SingleClassroomGradebook 
                    classroomId={id!} 
                    studentId={profile.id}
                  />
                )}
              </div>
            </TabsContent>

            {/* Student Calendar Tab */}
            <TabsContent value="calendar" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Class Calendar</h2>
                    <p className="text-muted-foreground">
                      View upcoming assignments and events for this class
                    </p>
                  </div>
                  {!canViewAsTeacher && (
                    <Button onClick={() => navigate("/calendar")}>
                      <Calendar className="h-4 w-4 mr-2" />
                      View Full Calendar
                    </Button>
                  )}
                </div>
                <Card className="p-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Upcoming Deadlines
                    </h3>
                    {effectiveAssignments.filter((a: any) => a.status === 'published' && a.due_date).length === 0 ? (
                      <p className="text-muted-foreground text-sm">No upcoming deadlines</p>
                    ) : (
                      <div className="space-y-3">
                        {effectiveAssignments
                          .filter((a: any) => a.status === 'published' && a.due_date)
                          .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                          .slice(0, 10)
                          .map((assignment: any) => (
                            <div key={assignment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 text-primary" />
                                <div>
                                  <p className="font-medium text-sm">{assignment.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {assignment.category || 'Assignment'}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline">
                                {new Date(assignment.due_date).toLocaleDateString()}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
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

          <ConfirmModal 
            open={showRemoveStudentModal} 
            onOpenChange={(open) => {
              setShowRemoveStudentModal(open);
              if (!open) setStudentToRemove(null);
            }} 
            title="Remove Student" 
            description={`Are you sure you want to remove ${studentToRemove?.profiles?.full_name || 'this student'} from the class? They will need to rejoin using the class code.`} 
            confirmText="Remove" 
            cancelText="Cancel" 
            onConfirm={handleRemoveStudent} 
          />
        </>}
    </div>;
};
export default ClassroomDetail;