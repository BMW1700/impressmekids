import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Copy, Trophy, Play, Megaphone, BookOpen, GraduationCap, FileText, MoreVertical, Trash2, Mic, Eye, EyeOff, UserCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ClassroomAIInsights } from "@/components/teacher/ClassroomAIInsights";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ClassroomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { isTeacher, isStudent, isLoading: permissionsLoading } = useClassroomPermissions(id);
  const [classroom, setClassroom] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
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
  const { assignments } = useAssignments(id);
  const { submissions: assignmentSubmissions } = useAssignmentSubmissions(viewingAssignmentId || undefined);
  const { deleteAssignment, toggleAssignmentStatus } = useMultiQuestionAssignments(id);

  useEffect(() => {
    // Wait for permissions to be determined before loading data
    if (!permissionsLoading) {
      loadClassroomData();
    }
  }, [id, permissionsLoading]);

  const loadClassroomData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Load classroom
      const { data: classroomData, error: classroomError } = await supabase
        .from('classrooms')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (classroomError) {
        console.error("Error loading classroom:", classroomError);
        throw classroomError;
      }
      
      if (!classroomData) {
        console.error("Classroom not found or access denied");
        setIsLoading(false);
        return;
      }
      
      setClassroom(classroomData);

      // Load students
      const { data: studentsData, error: studentsError } = await supabase
        .from('classroom_students')
        .select(`
          *,
          profiles!student_id (
            id,
            full_name,
            email,
            student_profiles!user_id (
              grade,
              avatar_url
            )
          )
        `)
        .eq('classroom_id', id);

      if (studentsError) throw studentsError;
      
      setStudents(studentsData || []);

      // Load tournaments
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('classroom_id', id)
        .order('created_at', { ascending: false });

      if (tournamentsError) throw tournamentsError;
      setTournaments(tournamentsData || []);

      // Load announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('classroom_announcements')
        .select('*')
        .eq('classroom_id', id)
        .order('created_at', { ascending: false });

      if (announcementsError) throw announcementsError;
      setAnnouncements(announcementsData || []);

      // Load flashcard sets
      const { data: flashcardsData, error: flashcardsError } = await supabase
        .from('flashcard_sets')
        .select(`
          *,
          question_groups!question_group_id (title, subject, grade)
        `)
        .eq('classroom_id', id)
        .order('created_at', { ascending: false });

      if (flashcardsError) throw flashcardsError;
      setFlashcardSets(flashcardsData || []);

      // Load parent access requests (teachers only)
      if (classroomData.teacher_id === session.user.id) {
        const { data: requestsData, error: requestsError } = await supabase
          .from('parent_access_requests')
          .select(`
            *,
            parent_accounts!parent_id (full_name, email),
            profiles!student_id (full_name)
          `)
          .eq('classroom_id', id)
          .order('created_at', { ascending: false });

        if (requestsError) throw requestsError;
        setParentRequests(requestsData || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load classroom data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyJoinCode = () => {
    if (classroom?.join_code) {
      navigator.clipboard.writeText(classroom.join_code);
      toast({
        title: "Copied!",
        description: "Join code copied to clipboard",
      });
    }
  };

  const handleToggleAssignmentStatus = (assignmentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    toggleAssignmentStatus({ id: assignmentId, newStatus: newStatus as 'draft' | 'published' });
  };

  const handleApproveParentRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('parent_access_requests')
        .update({ 
          status: 'approved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request Approved",
        description: "Parent can now view their child's progress",
      });

      loadClassroomData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    }
  };

  const handleDenyParentRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('parent_access_requests')
        .update({ 
          status: 'denied',
          resolved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request Denied",
        description: "Parent access request has been denied",
      });

      loadClassroomData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to deny request",
        variant: "destructive",
      });
    }
  };

  if (isLoading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isTeacher && !isStudent) {
    return (
      <div className="min-h-screen flex flex-col">
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
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen flex flex-col">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
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

          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl">{classroom.name}</CardTitle>
                <Badge variant="outline" className="font-mono text-lg px-4 py-2">
                  {classroom.join_code}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {students.length} student{students.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {isTeacher && (
                  <Button variant="outline" size="sm" onClick={copyJoinCode}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Join Code
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{isTeacher ? 'Classroom Management' : 'Classroom'}</h2>
            {isTeacher && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/teacher/questions/${id}`)}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Manage Questions
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/teacher/assignment/create/${id}`)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Create Assignment
                </Button>
                <Button
                  className="bg-gradient-primary hover:opacity-90"
                  onClick={() => setShowCreateAnnouncement(true)}
                >
                  <Megaphone className="mr-2 h-4 w-4" />
                  Send Announcement
                </Button>
              </div>
            )}
          </div>

          <Tabs defaultValue={searchParams.get('tab') || (isStudent ? "assignments" : "students")} className="mb-8">
            <TabsList className={cn("grid w-full", isTeacher ? "grid-cols-7" : "grid-cols-4")}>
              {isTeacher && <TabsTrigger value="students">Students</TabsTrigger>}
              {isTeacher && <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>}
              {isTeacher && (
                <TabsTrigger value="parent-requests" className="relative">
                  Parent Requests
                  {parentRequests.filter(r => r.status === 'pending').length > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                    >
                      {parentRequests.filter(r => r.status === 'pending').length}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
              <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
              <TabsTrigger value="study">Study Materials</TabsTrigger>
            </TabsList>

            {isTeacher && (
              <TabsContent value="students" className="mt-6">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold">Student Roster</h2>
                </div>

              {students.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">No Students Yet</h3>
              <p className="text-muted-foreground mb-4">
                Share the join code <span className="font-mono font-bold">{classroom.join_code}</span> with your students
              </p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => (
                <Card key={student.id} className="shadow-card">
                  <CardHeader>
                    <CardTitle>{student.profiles?.full_name || 'Student'}</CardTitle>
                    {student.profiles?.email && (
                      <p className="text-sm text-muted-foreground">{student.profiles.email}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {student.student_profiles?.[0]?.grade && (
                      <Badge variant="secondary">Grade {student.student_profiles[0].grade}</Badge>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Joined {new Date(student.joined_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
                </div>
              )}
              </TabsContent>
            )}

            {isTeacher && (
              <TabsContent value="ai-insights" className="mt-6">
                <ClassroomAIInsights classroomId={id!} />
              </TabsContent>
            )}

            {isTeacher && (
              <TabsContent value="parent-requests" className="mt-6">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold">Parent Access Requests</h2>
                  <p className="text-muted-foreground mt-1">
                    Approve or deny parent requests to view their child's progress
                  </p>
                </div>

                {parentRequests.length === 0 ? (
                  <Card className="p-12 text-center">
                    <UserCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-bold mb-2">No Parent Requests</h3>
                    <p className="text-muted-foreground">
                      When parents request access to view their child's progress, they'll appear here
                    </p>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {parentRequests.map((request) => (
                      <ParentAccessRequestCard
                        key={request.id}
                        id={request.id}
                        parentName={request.parent_accounts?.full_name || 'Parent'}
                        parentEmail={request.parent_accounts?.email || ''}
                        studentName={request.profiles?.full_name || 'Student'}
                        message={request.message}
                        status={request.status}
                        createdAt={request.created_at}
                        onApprove={handleApproveParentRequest}
                        onDeny={handleDenyParentRequest}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            <TabsContent value="assignments" className="mt-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Assignments</h2>
                {isTeacher && (
                  <Button
                    className="bg-gradient-primary hover:opacity-90"
                    onClick={() => navigate(`/teacher/assignment/create/${id}`)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Create Assignment
                  </Button>
                )}
              </div>

              {!assignments || assignments.length === 0 ? (
                <Card className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-bold mb-2">No Assignments Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {isTeacher 
                      ? 'Create multi-question assignments with various question types'
                      : 'Your teacher hasn\'t posted any assignments yet'}
                  </p>
                  {isTeacher && (
                    <Button
                      className="bg-gradient-primary hover:opacity-90"
                      onClick={() => navigate(`/teacher/assignment/create/${id}`)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Create First Assignment
                    </Button>
                  )}
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assignments.map((assignment: any) => (
                    <Card key={assignment.id} className="shadow-card hover:shadow-purple transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{assignment.title}</CardTitle>
                            {assignment.assignment_type === 'speaking' && (
                              <span title="Speaking Assignment">
                                <Mic className="h-4 w-4 text-primary" />
                              </span>
                            )}
                            {(assignment.assignment_type === 'reading_comprehension' || 
                              assignment.assignment_type === 'multi_question') && (
                              <div className="flex items-center gap-1">
                                <span title="Reading/Questions">
                                  <BookOpen className="h-4 w-4 text-primary" />
                                </span>
                                <span title="Includes Speaking">
                                  <Mic className="h-4 w-4 text-primary" />
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={assignment.status === 'published' ? 'default' : 'secondary'}>
                              {assignment.status === 'published' ? (
                                <>
                                  <Eye className="h-3 w-3 mr-1" />
                                  Published
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Draft
                                </>
                              )}
                            </Badge>
                            {isTeacher && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleToggleAssignmentStatus(assignment.id, assignment.status)}
                                  >
                                    {assignment.status === 'published' ? (
                                      <>
                                        <EyeOff className="mr-2 h-4 w-4" />
                                        Unpublish
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Publish
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setDeleteAssignmentId(assignment.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {assignment.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {assignment.description}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Badge variant="outline">
                              {assignment.question_count || 1} Question{(assignment.question_count || 1) !== 1 ? 's' : ''}
                            </Badge>
                            {assignment.timer_minutes && (
                              <Badge variant="outline">
                                {assignment.timer_minutes} min
                              </Badge>
                            )}
                          </div>
                          {assignment.due_date && (
                            <p className="text-xs text-muted-foreground">
                              Due: {new Date(assignment.due_date).toLocaleDateString()}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(assignment.created_at).toLocaleDateString()}
                          </p>
                          
                          {isTeacher && <AssignmentStatsCard assignmentId={assignment.id} />}
                          
                          {isTeacher && assignment.status === 'draft' && (
                            <Button
                              variant="outline"
                              className="w-full mt-2"
                              onClick={() => navigate(`/teacher/assignment/create/${id}?edit=${assignment.id}`)}
                            >
                              Edit Draft
                            </Button>
                          )}
                          
                          {assignment.status === 'published' && (
                            <Button
                              variant="outline"
                              className="w-full mt-4"
                              onClick={() => {
                                if (isTeacher) {
                                  setViewingAssignmentId(assignment.id);
                                } else {
                                  navigate(`/student/assignment/${assignment.id}?classroom=${id}`);
                                }
                              }}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              {isTeacher ? 'View Submissions' : 'Start Assignment'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="announcements" className="mt-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold">Announcements & Assignments</h2>
              </div>

              {announcements.length === 0 ? (
                <Card className="p-12 text-center">
                  <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-bold mb-2">No Announcements Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {isTeacher 
                      ? 'Send messages and assignments to all students in this classroom'
                      : 'Your teacher hasn\'t posted any announcements yet'}
                  </p>
                  {isTeacher && (
                    <Button
                      className="bg-gradient-primary hover:opacity-90"
                      onClick={() => setShowCreateAnnouncement(true)}
                    >
                      <Megaphone className="mr-2 h-4 w-4" />
                      Send to Students
                    </Button>
                  )}
                </Card>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <AnnouncementCard
                      key={announcement.id}
                      title={announcement.title}
                      content={announcement.content}
                      type={announcement.announcement_type}
                      createdAt={announcement.created_at}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tournaments" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Tournaments</h2>
                {isTeacher && (
                  <Button
                    className="bg-gradient-primary hover:opacity-90"
                    onClick={() => setShowSelectGame(true)}
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    Create Tournament
                  </Button>
                )}
              </div>

              {tournaments.length === 0 ? (
                <Card className="p-12 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-bold mb-2">No Tournaments Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {isTeacher
                      ? 'Create your first Jeopardy Duel tournament for this classroom'
                      : 'Your teacher hasn\'t created any tournaments yet'}
                  </p>
                  {isTeacher && (
                    <Button
                      className="bg-gradient-primary hover:opacity-90"
                      onClick={() => setShowSelectGame(true)}
                    >
                      <Trophy className="mr-2 h-4 w-4" />
                      Create Tournament
                    </Button>
                  )}
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tournaments.map((tournament) => (
                    <Card key={tournament.id} className="shadow-card hover:shadow-purple transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{tournament.name}</CardTitle>
                          <Badge variant={
                            tournament.status === 'completed' ? 'secondary' :
                            tournament.status === 'in_progress' ? 'default' : 'outline'
                          }>
                            {tournament.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Tournament created
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(tournament.created_at).toLocaleDateString()}
                          </p>
                          <Button
                            variant="outline"
                            className="w-full mt-4"
                            onClick={() => {
                              if (isTeacher) {
                                navigate(`/teacher/tournament/control?tournament=${tournament.id}`);
                              } else {
                                navigate(`/games/jeopardy-1v1?tournament=${tournament.id}`);
                              }
                            }}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            {isTeacher ? 'Control Tournament' : 'Join Tournament'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="study" className="mt-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold">Study Materials</h2>
              </div>

              {viewingFlashcardSet ? (
                <div>
                  <Button
                    variant="outline"
                    onClick={() => setViewingFlashcardSet(null)}
                    className="mb-4"
                  >
                    ← Back to Study Materials
                  </Button>
                  <FlashcardSetViewer flashcards={viewingFlashcardSet.flashcards} />
                </div>
              ) : flashcardSets.length === 0 ? (
                <Card className="p-12 text-center">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-bold mb-2">No Study Materials Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {isTeacher
                      ? "Generate flashcard sets from your question groups"
                      : "Your teacher hasn't created any flashcard sets yet"}
                  </p>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {flashcardSets.map((set) => (
                    <Card key={set.id} className="shadow-card hover:shadow-purple transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{set.title}</CardTitle>
                        {set.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {set.description}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {set.question_groups?.subject && (
                              <Badge variant="secondary">{set.question_groups.subject}</Badge>
                            )}
                            {set.question_groups?.grade !== undefined && (
                              <Badge variant="outline">
                                {set.question_groups.grade === 0
                                  ? "K"
                                  : `Grade ${set.question_groups.grade}`}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <strong>{set.flashcards.length}</strong> flashcards
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(set.created_at).toLocaleDateString()}
                          </p>
                          <Button
                            className="w-full bg-gradient-primary"
                            onClick={() => setViewingFlashcardSet(set)}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Study Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {isTeacher && (
        <>
          <SelectGameModal
            open={showSelectGame}
            onOpenChange={setShowSelectGame}
            onSelectGame={(gameType) => {
              setSelectedGameType(gameType);
              setShowCreateTournament(true);
            }}
          />

          <CreateTournamentModal
            open={showCreateTournament}
            onOpenChange={setShowCreateTournament}
            classroomId={id!}
            gameType={selectedGameType}
          />

          <CreateAnnouncementModal
            open={showCreateAnnouncement}
            onOpenChange={setShowCreateAnnouncement}
            classroomId={id!}
            onSuccess={loadClassroomData}
          />

          <CreateAssignmentModal
            open={showCreateAssignment}
            onOpenChange={setShowCreateAssignment}
            classroomId={id!}
            onSuccess={loadClassroomData}
          />

          {viewingAssignmentId && (
            <Dialog open={!!viewingAssignmentId} onOpenChange={(open) => !open && setViewingAssignmentId(null)}>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Student Submissions</DialogTitle>
                  <DialogDescription>
                    Review and grade student work for this assignment
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <SubmissionsList 
                    submissions={assignmentSubmissions}
                    classroomId={id!}
                    assignmentType={assignments.find((a: any) => a.id === viewingAssignmentId)?.assignment_type || 'multi_question'}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}

          <ConfirmModal
            open={!!deleteAssignmentId}
            onOpenChange={(open) => !open && setDeleteAssignmentId(null)}
            title="Delete Assignment"
            description="Are you sure you want to delete this assignment? This action cannot be undone."
            confirmText="Yes"
            cancelText="No"
            onConfirm={() => {
              if (deleteAssignmentId) {
                deleteAssignment(deleteAssignmentId);
                setDeleteAssignmentId(null);
              }
            }}
          />
        </>
      )}
    </div>
  );
};

export default ClassroomDetail;
