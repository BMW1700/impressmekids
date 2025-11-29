import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Users, Play, Crown, Settings, Edit, SkipForward, StopCircle } from "lucide-react";
import { useTournamentRealtime } from "@/hooks/useTournamentRealtime";
import { useToast } from "@/hooks/use-toast";
import { SelectQuestionsModal } from "@/components/tournament/SelectQuestionsModal";

interface TournamentLobbyProps {
  tournament: any;
  userPlayer: any;
  onMatchStart: (match: any) => void;
}

export const TournamentLobby = ({ tournament, userPlayer, onMatchStart }: TournamentLobbyProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [showSelectQuestions, setShowSelectQuestions] = useState(false);
  
  const { matches: realtimeMatches } = useTournamentRealtime(tournament.id);

  useEffect(() => {
    checkIfTeacher();
    loadLobbyData();
  }, [tournament.id]);

  const checkIfTeacher = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: classroomData } = await supabase
        .from('classrooms')
        .select('teacher_id')
        .eq('id', tournament.classroom_id)
        .single();

      if (classroomData?.teacher_id === session.user.id) {
        setIsTeacher(true);
      }
    } catch (error) {
      console.error("Error checking teacher status:", error);
    }
  };

  useEffect(() => {
    if (realtimeMatches.length > 0) {
      setMatches(realtimeMatches);
      
      // Check if user has an active match
      if (userPlayer) {
        const userMatch = realtimeMatches.find(
          m => (m.player_a === userPlayer.id || m.player_b === userPlayer.id) &&
               m.status === 'in_progress'
        );
        if (userMatch) {
          onMatchStart(userMatch);
        }
      }
    }
  }, [realtimeMatches, userPlayer]);

  const loadLobbyData = async () => {
    try {
      // Load players - may return empty for students before seeding
      try {
        const { data: playersData } = await supabase
          .from('tournament_players')
          .select('*, profile:profiles(*)')
          .eq('tournament_id', tournament.id)
          .order('seed', { ascending: true });

        setPlayers(playersData || []);
      } catch (error) {
        console.log('Players not available yet:', error);
        setPlayers([]);
      }

      // Load matches - may return empty for students before they're created
      try {
        const { data: matchesData } = await supabase
          .from('matches')
          .select(`
            *,
            player_a_data:tournament_players!matches_player_a_fkey(profile:profiles(*)),
            player_b_data:tournament_players!matches_player_b_fkey(profile:profiles(*))
          `)
          .eq('tournament_id', tournament.id)
          .order('round', { ascending: true });

        setMatches(matchesData || []);
      } catch (error) {
        console.log('Matches not available yet:', error);
        setMatches([]);
      }

      // Load question count - ONLY for teachers
      if (isTeacher) {
        try {
          const { data: questionsData } = await supabase
            .from('tournament_questions')
            .select('id')
            .eq('tournament_id', tournament.id);
          
          setQuestionCount(questionsData?.length || 0);
        } catch (error) {
          console.log('Questions not available:', error);
          setQuestionCount(0);
        }
      }
    } catch (error) {
      console.error('Error loading lobby data:', error);
    } finally {
      setIsLoadingData(false);
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
      const { data: seedData, error: seedError } = await supabase.functions.invoke(
        'seed-and-create-matches',
        { body: { tournament_id: tournament.id } }
      );

      if (seedError) throw seedError;

      toast({
        title: "Tournament Started",
        description: `Created ${seedData.matches_created} matches. Players can now join!`,
      });

      loadLobbyData();
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
      const waitingMatches = matches.filter(m => m.status === 'waiting');
      
      for (const match of waitingMatches) {
        const { error } = await supabase.functions.invoke('start-round', {
          body: { match_id: match.id }
        });
        if (error) throw error;
      }

      toast({
        title: "Round Started",
        description: "All matches are now in progress",
      });

      loadLobbyData();
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
        .eq('id', tournament.id);

      if (error) throw error;

      toast({
        title: "Tournament Ended",
        description: "The tournament has been completed",
      });

      loadLobbyData();
    } catch (error: any) {
      console.error("Error ending tournament:", error);
      toast({
        title: "Error",
        description: "Failed to end tournament",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'outline';
      case 'in_progress': return 'default';
      case 'completed': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoadingData) {
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
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="inline-flex p-3 rounded-full bg-gradient-primary">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold">{tournament.name}</h1>
                <p className="text-muted-foreground">
                  {tournament.classroom?.name || 'Tournament Lobby'}
                </p>
              </div>
              <Badge variant={getStatusColor(tournament.status)} className="text-lg px-4 py-2">
                {tournament.status}
              </Badge>
            </div>

            {isTeacher && (
              <Card className="mb-8 shadow-card border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Teacher Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setShowSelectQuestions(true)}
                      disabled={tournament.status !== 'waiting'}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Questions ({questionCount})
                    </Button>
                    
                    <Button
                      className="w-full justify-start bg-gradient-primary hover:opacity-90"
                      onClick={handleSeedAndStart}
                      disabled={tournament.status !== 'waiting' || isStarting || players.length === 0}
                    >
                      {isStarting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Play className="mr-2 h-4 w-4" />
                      Seed & Start
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
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Players
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {players.length === 0 && tournament.status === 'waiting' ? 'Pending' : players.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{matches.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{tournament.status}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Bracket</CardTitle>
                </CardHeader>
                <CardContent>
                  {matches.length === 0 ? (
                    <div className="text-center py-8 space-y-3">
                      <div className="text-4xl">🎮</div>
                      <p className="font-semibold text-lg">Waiting for Tournament to Start</p>
                      {!isTeacher && (
                        <div className="text-sm text-muted-foreground space-y-2">
                          <p>Your teacher is setting up the game.</p>
                          <p>Once they click "Seed & Start", you'll be automatically added!</p>
                          <p className="text-primary font-medium">Get ready for a head-to-head trivia duel! 🏆</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {matches.map((match) => (
                        <Card key={match.id} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">Round {match.round}</Badge>
                            <Badge variant={getStatusColor(match.status)}>
                              {match.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 items-center">
                            <div className="text-sm">
                              {match.player_a_data?.profile?.full_name || 'TBD'}
                              <span className="ml-2 font-bold">{match.score_a}</span>
                            </div>
                            <div className="text-center text-muted-foreground text-xs">vs</div>
                            <div className="text-sm text-right">
                              <span className="mr-2 font-bold">{match.score_b}</span>
                              {match.player_b_data?.profile?.full_name || 'TBD'}
                            </div>
                          </div>
                          {match.winner_id && (
                            <div className="mt-2 text-center text-sm text-primary font-semibold">
                              Winner: {match.winner_id === match.player_a ? 
                                match.player_a_data?.profile?.full_name : 
                                match.player_b_data?.profile?.full_name}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Players</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {players.map((player, index) => (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          player.id === userPlayer?.id ? 'bg-primary/10 border border-primary' : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            {player.seed}
                          </div>
                          <span className="font-medium">
                            {player.profile?.full_name}
                            {player.id === userPlayer?.id && ' (You)'}
                          </span>
                        </div>
                        <Badge variant={player.status === 'active' ? 'default' : 'secondary'}>
                          {player.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Back to Classroom
              </Button>
              {tournament.status === 'waiting' && (
                <Button variant="secondary" disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Waiting for Tournament to Start
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <SelectQuestionsModal
        open={showSelectQuestions}
        onOpenChange={setShowSelectQuestions}
        tournamentId={tournament.id}
        classroomId={tournament.classroom_id}
        onSuccess={loadLobbyData}
      />
    </div>
  );
};
