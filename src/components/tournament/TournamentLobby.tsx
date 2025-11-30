import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Users, Play, Crown, Settings, Edit, SkipForward, StopCircle } from "lucide-react";
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
  const [classroomStudentCount, setClassroomStudentCount] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [showSelectQuestions, setShowSelectQuestions] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

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

  const loadLobbyData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Load players using SECURITY DEFINER function
      try {
        const { data: playersData, error: playersError } = await supabase
          .rpc('get_tournament_players', { _tournament_id: tournament.id });

        if (playersError) {
          console.error('Error loading players:', playersError);
          setPlayers([]);
        } else {
          setPlayers(playersData || []);
        }
        
        // Check if current user has joined
        if (session && playersData) {
          const userHasJoined = playersData.some(p => p.profile_id === session.user.id);
          setHasJoined(userHasJoined);
        }
      } catch (error) {
        console.log('Players not available yet:', error);
        setPlayers([]);
      }

      // Load matches - simplified query without broken nested joins
      try {
        const { data: matchesData } = await supabase
          .from('matches')
          .select('*')
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

  const handleJoinTournament = async () => {
    setIsJoining(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be signed in to join",
          variant: "destructive",
        });
        return;
      }

      // Use upsert to handle case where student already joined
      const { error } = await supabase
        .from('tournament_players')
        .upsert(
          {
            tournament_id: tournament.id,
            profile_id: session.user.id,
            seed: players.length + 1
          },
          { 
            onConflict: 'tournament_id,profile_id',
            ignoreDuplicates: true 
          }
        );

      if (error) {
        // Check if it's a duplicate error - treat as success
        if (error.code === '23505') {
          toast({
            title: "Already Joined!",
            description: "You're already in the tournament!",
          });
          setHasJoined(true);
        } else {
          console.error('Join error:', error);
          toast({
            title: "Error",
            description: "Failed to join tournament",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Joined!",
          description: "You're in the tournament!",
        });
        setHasJoined(true);
      }
      loadLobbyData();
    } catch (error) {
      console.error('Join error:', error);
      toast({
        title: "Error",
        description: "Failed to join tournament",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };


  // Lightweight polling ONLY when tournament is waiting (not started yet)
  useEffect(() => {
    // Only poll for player updates when tournament is in waiting status
    if (tournament.status !== 'waiting') return;
    
    const loadPlayersOnly = async () => {
      try {
        const { data: playersData } = await supabase
          .rpc('get_tournament_players', { _tournament_id: tournament.id });
        
        if (playersData) {
          setPlayers(playersData);
          
          // Check if current user has joined
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const userHasJoined = playersData.some(p => p.profile_id === session.user.id);
            setHasJoined(userHasJoined);
          }
        }
      } catch (error) {
        console.error('Failed to load players:', error);
      }
    };
    
    // Much slower polling - only for player count updates in lobby
    const pollInterval = setInterval(loadPlayersOnly, 8000);
    
    return () => clearInterval(pollInterval);
  }, [tournament.id, tournament.status]);

  const handleSeedAndStart = async () => {
    if (players.length < 2) {
      toast({
        title: "Not Enough Players",
        description: "At least 2 students must join before starting.",
        variant: "destructive",
      });
      return;
    }

    if (questionCount === 0) {
      toast({
        title: "No Questions",
        description: "Please assign questions before starting the tournament.",
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
      if (waitingMatches.length === 0) {
        toast({
          title: "No matches waiting",
          description: "All matches are already in progress or completed",
        });
        setIsStarting(false);
        return;
      }

      const currentRound = Math.min(...waitingMatches.map(m => m.round));
      
      const { error } = await supabase.functions.invoke('start-round', {
        body: {
          tournament_id: tournament.id,
          round_number: currentRound
        }
      });

      if (error) throw error;

      toast({
        title: "Round Started",
        description: `Round ${currentRound} started - all matches are now in progress`,
      });

      loadLobbyData();
    } catch (error: any) {
      console.error("Error starting round:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start round",
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

            {tournament.status === 'completed' && (
              <Card className="mb-8 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 border-yellow-500/50 shadow-xl">
                <CardContent className="py-8 text-center">
                  <div className="text-6xl mb-4">🏆</div>
                  <h2 className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                    Tournament Champion!
                  </h2>
                  <p className="text-2xl font-semibold mb-2">
                    {(() => {
                      // Find the winner - the player who is not eliminated
                      const winner = players.find(p => p.status === 'active');
                      return winner?.display_name || 'Unknown';
                    })()}
                  </p>
                  <p className="text-muted-foreground mt-2">
                    Congratulations on winning the tournament!
                  </p>
                  <div className="mt-6 flex justify-center gap-2">
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      🥇 Champion
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

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
                      disabled={tournament.status !== 'waiting' || isStarting || players.length < 2}
                    >
                      {isStarting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Play className="mr-2 h-4 w-4" />
                      Start Tournament
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
                      {matches.map((match) => {
                        // Resolve player names from players array
                        const playerAName = players.find(p => p.id === match.player_a)?.display_name || 'TBD';
                        const playerBName = players.find(p => p.id === match.player_b)?.display_name || 'TBD';
                        
                        return (
                          <Card key={match.id} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">Round {match.round}</Badge>
                              <Badge variant={getStatusColor(match.status)}>
                                {match.status}
                              </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{playerAName}</span>
                            <span className="text-muted-foreground">vs</span>
                            <span className="font-medium">{playerBName}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="font-bold">{match.score_a}</span>
                            <span className="font-bold">{match.score_b}</span>
                          </div>
                          {match.winner_id && (
                            <div className="mt-2 text-center text-sm text-primary font-semibold">
                              Winner: {players.find(p => p.id === match.winner_id)?.display_name || 'TBD'}
                            </div>
                          )}
                        </Card>
                        );
                      })}
                    </div>
                  )}
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
                  {!isTeacher && tournament.status === 'waiting' && !hasJoined && (
                    <Button 
                      onClick={handleJoinTournament}
                      disabled={isJoining}
                      className="w-full mb-4 bg-gradient-primary hover:opacity-90"
                      size="lg"
                    >
                      {isJoining ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        <>
                          🎮 Join Tournament
                        </>
                      )}
                    </Button>
                  )}
                  
                  {!isTeacher && hasJoined && tournament.status === 'waiting' && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded text-center">
                      <p className="text-green-600 dark:text-green-400 font-medium">
                        ✅ You've Joined! Waiting for teacher to start...
                      </p>
                    </div>
                  )}
                  
                  {players.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {isTeacher ? 'Waiting for students to join...' : 'No players yet. Be the first to join!'}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {players.map((player) => {
                        const isCurrentUser = player.profile_id === userPlayer?.id;
                        
                        return (
                           <div
                             key={player.id}
                             className={`flex items-center justify-between p-2 rounded ${
                               isCurrentUser ? 'bg-primary/20 border border-primary/40' : 'bg-secondary/20'
                             }`}
                           >
                             <div className="flex items-center gap-2">
                               <span className="text-xs font-semibold bg-primary/20 text-primary px-2 py-1 rounded">
                                 #{player.seed}
                               </span>
                                <span className={`font-medium ${isCurrentUser ? 'text-primary' : ''}`}>
                                  {player.display_name} {isCurrentUser ? '(You)' : ''}
                                </span>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   )}
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
