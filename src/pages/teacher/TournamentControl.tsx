import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings, Play, SkipForward, StopCircle, Edit, Users } from "lucide-react";
import { SelectQuestionsModal } from "@/components/tournament/SelectQuestionsModal";
import { useTournamentRealtime } from "@/hooks/useTournamentRealtime";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const TournamentControl = () => {
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get('tournament');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tournament, setTournament] = useState<any>(null);
  const [classroom, setClassroom] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [showSelectQuestions, setShowSelectQuestions] = useState(false);
  
  const { matches, matchStates } = useTournamentRealtime(tournamentId || undefined);

  useEffect(() => {
    if (tournamentId) {
      loadTournamentData();
    }
  }, [tournamentId]);

  useEffect(() => {
    // Update tournament from realtime
    if (matches.length > 0 && tournament) {
      const hasInProgress = matches.some(m => m.status === 'in_progress');
      const allCompleted = matches.length > 0 && matches.every(m => m.status === 'completed');
      
      if (hasInProgress && tournament.status === 'waiting') {
        setTournament({ ...tournament, status: 'in_progress' });
      } else if (allCompleted && tournament.status === 'in_progress') {
        setTournament({ ...tournament, status: 'completed' });
      }
    }
  }, [matches]);

  const loadTournamentData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Load tournament with retry logic for new tournaments
      let tournamentData = null;
      let attempts = 0;
      const maxAttempts = 15;
      
      while (!tournamentData && attempts < maxAttempts) {
        const { data, error } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', tournamentId)
          .maybeSingle();
        
        if (error) throw error;
        
        if (data) {
          tournamentData = data;
          break;
        }
        
        // Wait before retrying (200ms)
        if (attempts < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        attempts++;
      }

      if (!tournamentData) {
        throw new Error('Tournament not found after polling');
      }

      // Load classroom separately to avoid RLS recursion
      const { data: classroomData, error: classroomError } = await supabase
        .from('classrooms')
        .select('*')
        .eq('id', tournamentData.classroom_id)
        .single();

      if (classroomError) throw classroomError;

      // Verify teacher ownership
      if (classroomData.teacher_id !== session.user.id) {
        toast({
          title: "Access Denied",
          description: "Only the classroom teacher can control this tournament",
          variant: "destructive",
        });
        navigate('/teacher/dashboard');
        return;
      }

      setTournament(tournamentData);
      setClassroom(classroomData);

      // Load players
      const { data: playersData, error: playersError } = await supabase
        .from('tournament_players')
        .select('*, profiles(full_name)')
        .eq('tournament_id', tournamentId)
        .order('seed');

      if (playersError) throw playersError;
      setPlayers(playersData || []);

      // Load question count
      const { data: questionsData, error: questionsError } = await supabase
        .from('tournament_questions')
        .select('id')
        .eq('tournament_id', tournamentId);

      if (questionsError) throw questionsError;
      setQuestionCount(questionsData?.length || 0);
    } catch (error: any) {
      console.error("Error loading tournament:", error);
      toast({
        title: "Error",
        description: "Failed to load tournament data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedAndStart = async () => {
    if (questionCount === 0) {
      toast({
        title: "No Questions Assigned",
        description: "Please assign questions to the tournament before starting",
        variant: "destructive",
      });
      setShowSelectQuestions(true);
      return;
    }

    if (players.length < 2) {
      toast({
        title: "Not Enough Players",
        description: "At least 2 players are needed to start the tournament",
        variant: "destructive",
      });
      return;
    }

    setIsStarting(true);
    try {
      // First seed players and create matches
      const { data: seedData, error: seedError } = await supabase.functions.invoke(
        'seed-and-create-matches',
        { body: { tournament_id: tournamentId } }
      );

      if (seedError) throw seedError;

      toast({
        title: "Tournament Started",
        description: `Created ${seedData.matches_created} matches. Players can now join!`,
      });

      loadTournamentData();
    } catch (error: any) {
      console.error("Error starting tournament:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start tournament",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleStartRound = async () => {
    setIsStarting(true);
    try {
      // Calculate current round from matches
      const currentRound = matches.length > 0 ? Math.max(...matches.map(m => m.round)) : 1;
      
      const { error } = await supabase.functions.invoke('start-round', {
        body: { tournament_id: tournamentId, round_number: currentRound }
      });
      
      if (error) throw error;

      toast({
        title: "Round Started",
        description: "All matches are now in progress",
      });

      loadTournamentData();
    } catch (error: any) {
      console.error("Error starting round:", error);
      toast({
        title: "Error",
        description: "Failed to start round",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndTournament = async () => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', tournamentId);

      if (error) throw error;

      toast({
        title: "Tournament Ended",
        description: "The tournament has been completed",
      });

      loadTournamentData();
    } catch (error: any) {
      console.error("Error ending tournament:", error);
      toast({
        title: "Error",
        description: "Failed to end tournament",
        variant: "destructive",
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

  if (!tournament) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header showAuthButtons={false} />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Tournament Not Found</h1>
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
                <BreadcrumbLink asChild>
                  <Link to={`/classrooms/${classroom?.id}`}>{classroom?.name}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{tournament.name} - Control</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{tournament.name}</h1>
              <div className="flex items-center gap-2">
                <Badge variant={
                  tournament.status === 'completed' ? 'secondary' :
                  tournament.status === 'in_progress' ? 'default' : 'outline'
                }>
                  {tournament.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {players.length} players • {questionCount} questions
                </span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Tournament Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowSelectQuestions(true)}
                  disabled={tournament.status !== 'waiting'}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Questions ({questionCount} selected)
                </Button>
                
                <Button
                  className="w-full justify-start bg-gradient-primary hover:opacity-90"
                  onClick={handleSeedAndStart}
                  disabled={tournament.status !== 'waiting' || isStarting || players.length === 0}
                >
                  {isStarting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Play className="mr-2 h-4 w-4" />
                  Seed Players & Create Matches
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleStartRound}
                  disabled={tournament.status !== 'in_progress' || isStarting || matches.every(m => m.status !== 'waiting')}
                >
                  {isStarting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <SkipForward className="mr-2 h-4 w-4" />
                  Start Round
                </Button>

                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={handleEndTournament}
                  disabled={tournament.status === 'completed'}
                >
                  <StopCircle className="mr-2 h-4 w-4" />
                  End Tournament
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Players ({players.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {players.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Waiting for students to join...
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {players.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{player.profiles?.full_name || 'Player'}</span>
                        <Badge variant="outline">Seed {player.seed}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Matches ({matches.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {matches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No matches created yet. Click "Seed Players & Create Matches" to begin.
                </p>
              ) : (
                <div className="space-y-4">
                  {matches.map((match) => (
                    <Card key={match.id} className="shadow-sm">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">Round {match.round}</Badge>
                              <Badge variant={
                                match.status === 'completed' ? 'secondary' :
                                match.status === 'in_progress' ? 'default' : 'outline'
                              }>
                                {match.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-medium">
                                {players.find(p => p.id === match.player_a)?.profiles?.full_name || 'Player A'}
                              </span>
                              <Badge variant="secondary">{match.score_a}</Badge>
                              <span className="text-muted-foreground">vs</span>
                              <Badge variant="secondary">{match.score_b}</Badge>
                              <span className="font-medium">
                                {players.find(p => p.id === match.player_b)?.profiles?.full_name || 'Player B'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      <SelectQuestionsModal
        open={showSelectQuestions}
        onOpenChange={setShowSelectQuestions}
        tournamentId={tournamentId!}
        classroomId={classroom?.id || tournament?.classroom_id}
        onSuccess={loadTournamentData}
      />
    </div>
  );
};

export default TournamentControl;