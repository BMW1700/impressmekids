import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Copy, Trophy, Play } from "lucide-react";
import { CreateTournamentModal } from "@/components/tournament/CreateTournamentModal";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ClassroomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [classroom, setClassroom] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTournament, setShowCreateTournament] = useState(false);

  useEffect(() => {
    loadClassroomData();
  }, [id]);

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
        .single();

      if (classroomError) throw classroomError;
      setClassroom(classroomData);

      // Load students
      const { data: studentsData, error: studentsError } = await supabase
        .from('classroom_students')
        .select(`
          *,
          profiles!classroom_students_student_id_fkey (
            id,
            full_name,
            email
          ),
          student_profiles (
            grade,
            avatar_url
          )
        `)
        .eq('classroom_id', id);

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Load tournaments
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('*, tournament_players(count)')
        .eq('classroom_id', id)
        .order('created_at', { ascending: false });

      if (tournamentsError) throw tournamentsError;
      setTournaments(tournamentsData || []);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                  <Link to="/teacher/dashboard">Dashboard</Link>
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
                <Button variant="outline" size="sm" onClick={copyJoinCode}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Join Code
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="students" className="mb-8">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
            </TabsList>

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

            <TabsContent value="tournaments" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Tournaments</h2>
                <Button
                  className="bg-gradient-primary hover:opacity-90"
                  onClick={() => setShowCreateTournament(true)}
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  Create Tournament
                </Button>
              </div>

              {tournaments.length === 0 ? (
                <Card className="p-12 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-bold mb-2">No Tournaments Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first Jeopardy Duel tournament for this classroom
                  </p>
                  <Button
                    className="bg-gradient-primary hover:opacity-90"
                    onClick={() => setShowCreateTournament(true)}
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    Create Tournament
                  </Button>
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
                            {tournament.tournament_players?.[0]?.count || 0} players
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(tournament.created_at).toLocaleDateString()}
                          </p>
                          <Button
                            variant="outline"
                            className="w-full mt-4"
                            onClick={() => navigate(`/games/jeopardy-1v1?tournament=${tournament.id}`)}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            View Tournament
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

      <CreateTournamentModal
        open={showCreateTournament}
        onOpenChange={setShowCreateTournament}
        classroomId={id!}
        onSuccess={loadClassroomData}
      />
    </div>
  );
};

export default ClassroomDetail;
