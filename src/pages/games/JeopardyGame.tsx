import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Users, Play } from "lucide-react";
import { TournamentLobby } from "@/components/tournament/TournamentLobby";
import { MatchPlayground } from "@/components/tournament/MatchPlayground";
import { useTournamentRealtime } from "@/hooks/useTournamentRealtime";
import { useToast } from "@/hooks/use-toast";
import { CreateTournamentModal } from "@/components/tournament/CreateTournamentModal";
import { SelectGameModal } from "@/components/tournament/SelectGameModal";

const JeopardyGame = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const tournamentId = searchParams.get('tournament');
  const [tournament, setTournament] = useState<any>(null);
  const [userPlayer, setUserPlayer] = useState<any>(null);
  const [currentMatch, setCurrentMatch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!!tournamentId);
  const [view, setView] = useState<'lobby' | 'match'>('lobby');
  const [isTeacher, setIsTeacher] = useState(false);
  const [teacherClassrooms, setTeacherClassrooms] = useState<any[]>([]);
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [showSelectGame, setShowSelectGame] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState<string>('jeopardy_duel');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');

  const { tournaments, matches, matchStates } = useTournamentRealtime(tournamentId || undefined);

  useEffect(() => {
    checkIfTeacher();
    if (tournamentId) {
      loadTournamentData();
    }
  }, [tournamentId]);

  const checkIfTeacher = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Use secure function to check role
      const { data: userRole } = await supabase
        .rpc('get_user_role', { _user_id: session.user.id });

      if (userRole === 'teacher') {
        setIsTeacher(true);
        loadTeacherClassrooms(session.user.id);
      }
    } catch (error) {
      console.error('Error checking teacher status:', error);
    }
  };

  const loadTeacherClassrooms = async (teacherId: string) => {
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeacherClassrooms(data || []);
    } catch (error) {
      console.error('Error loading classrooms:', error);
    }
  };

  useEffect(() => {
    // Watch for realtime tournament updates
    if (tournaments.length > 0 && tournamentId) {
      const updatedTournament = tournaments.find(t => t.id === tournamentId);
      if (updatedTournament) {
        setTournament(prev => ({
          ...prev,
          ...updatedTournament,
          classroom: prev?.classroom  // Preserve joined data
        }));
      }
    }
  }, [tournaments, tournamentId]);

  // Poll for userPlayer if not yet set (student may be seeded after page load)
  useEffect(() => {
    if (!tournamentId || userPlayer) return;
    
    console.log('[JeopardyGame] Starting userPlayer polling...');
    
    const pollForUserPlayer = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const { data: playerData } = await supabase
          .from('tournament_players')
          .select('*')
          .eq('tournament_id', tournamentId)
          .eq('profile_id', session.user.id)
          .maybeSingle();
        
        if (playerData) {
          console.log('✅ [JeopardyGame] userPlayer found via polling:', playerData);
          setUserPlayer(playerData);
        }
      } catch (error) {
        console.error('[JeopardyGame] Error polling for userPlayer:', error);
      }
    };
    
    const pollInterval = setInterval(pollForUserPlayer, 2000);
    pollForUserPlayer(); // Run immediately
    
    return () => clearInterval(pollInterval);
  }, [tournamentId, userPlayer]);

  useEffect(() => {
    console.log('🔍 [JeopardyGame] Checking for active match...', { 
      matchCount: matches.length, 
      hasUserPlayer: !!userPlayer,
      userPlayerId: userPlayer?.id 
    });
    
    if (matches.length > 0 && userPlayer) {
      const activeMatch = matches.find(
        m => (m.player_a === userPlayer.id || m.player_b === userPlayer.id) &&
             (m.status === 'waiting' || m.status === 'in_progress')
      );
      
      console.log('🎮 [JeopardyGame] Active match found:', activeMatch);
      
      if (activeMatch && activeMatch.status === 'in_progress') {
        console.log('✅ [JeopardyGame] Transitioning to match view');
        setCurrentMatch(activeMatch);
        setView('match');
      }
    }
  }, [matches, userPlayer]);

  // Poll for match status changes
  useEffect(() => {
    if (!tournamentId || !userPlayer) return;
    
    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .or(`player_a.eq.${userPlayer.id},player_b.eq.${userPlayer.id}`)
        .eq('status', 'in_progress')
        .maybeSingle();
      
      if (data) {
        console.log('🔄 [JeopardyGame] Poll found active match:', data);
        setCurrentMatch(data);
        setView('match');
      }
    }, 2000);
    
    return () => clearInterval(pollInterval);
  }, [tournamentId, userPlayer]);

  const loadTournamentData = async () => {
    setIsLoading(true);
    try {
      console.log("Loading tournament data for:", tournamentId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("No session found, redirecting to auth");
        navigate('/auth');
        return;
      }

      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*, classroom:classrooms(*)')
        .eq('id', tournamentId)
        .single();

      if (tournamentError) {
        console.error("Tournament error:", tournamentError);
        throw tournamentError;
      }
      
      console.log("Tournament loaded:", tournamentData);
      setTournament(tournamentData);

      const { data: playerData } = await supabase
        .from('tournament_players')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('profile_id', session.user.id)
        .single();

      if (playerData) {
        console.log("Player found:", playerData);
        setUserPlayer(playerData);
      } else {
        console.log("No player record found for this user");
      }
    } catch (error: any) {
      console.error('Error loading tournament:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load tournament",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tournamentId || !tournament) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header showAuthButtons={false} />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex p-4 rounded-full bg-gradient-primary mb-4">
                  <Trophy className="h-12 w-12 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Jeopardy Duel
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Challenge your classmates in epic trivia showdowns!
                </p>
              </div>

              {isTeacher && (
                <div className="mb-8 space-y-4">
                  <Card className="shadow-card border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Teacher Controls
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <Button
                          className="bg-gradient-primary hover:opacity-90 w-full"
                          onClick={() => {
                            if (teacherClassrooms.length === 1) {
                              setSelectedClassroomId(teacherClassrooms[0].id);
                              setShowSelectGame(true);
                            } else if (teacherClassrooms.length > 1) {
                              toast({
                                title: "Select a Classroom",
                                description: "Please select which classroom to create the tournament in",
                              });
                            } else {
                              toast({
                                title: "No Classrooms",
                                description: "Create a classroom first before creating tournaments",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Create Tournament
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (teacherClassrooms.length === 1) {
                              navigate(`/teacher/questions/${teacherClassrooms[0].id}`);
                            } else if (teacherClassrooms.length > 1) {
                              toast({
                                title: "Select a Classroom",
                                description: "Please select which classroom to manage questions for",
                              });
                            } else {
                              toast({
                                title: "No Classrooms",
                                description: "Create a classroom first before managing questions",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="w-full"
                        >
                          Manage Questions
                        </Button>
                      </div>

                      {teacherClassrooms.length > 1 && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Select Classroom:</label>
                          <select
                            className="w-full p-2 border rounded-md"
                            value={selectedClassroomId}
                            onChange={(e) => setSelectedClassroomId(e.target.value)}
                          >
                            <option value="">Choose a classroom...</option>
                            {teacherClassrooms.map((classroom) => (
                              <option key={classroom.id} value={classroom.id}>
                                {classroom.name}
                              </option>
                            ))}
                          </select>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <Button
                              className="w-full"
                              disabled={!selectedClassroomId}
                              onClick={() => setShowSelectGame(true)}
                            >
                              Create Tournament in Selected Classroom
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full"
                              disabled={!selectedClassroomId}
                              onClick={() => navigate(`/teacher/questions/${selectedClassroomId}`)}
                            >
                              Manage Questions in Selected Classroom
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {teacherClassrooms.map((classroom) => (
                    <Card key={classroom.id} className="shadow-card">
                      <CardHeader>
                        <CardTitle className="text-lg">{classroom.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate(`/classrooms/${classroom.id}`)}
                        >
                          View Classroom
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Card className="shadow-card mb-6">
                <CardHeader>
                  <CardTitle>How to Play</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      1
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold mb-1">Join a Tournament</h3>
                      <p className="text-muted-foreground">
                        Your teacher creates a tournament in your classroom
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      2
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold mb-1">Buzz In Fast</h3>
                      <p className="text-muted-foreground">
                        Read questions and buzz in to answer before your opponent
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      3
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold mb-1">Win Matches</h3>
                      <p className="text-muted-foreground">
                        Answer correctly to earn points and advance through the bracket
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <Button
                  className="bg-gradient-primary hover:opacity-90"
                  onClick={() => navigate(isTeacher ? '/teacher/dashboard' : '/student/dashboard')}
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
        <>
          <SelectGameModal
            open={showSelectGame}
            onOpenChange={setShowSelectGame}
            onSelectGame={(gameType) => {
              setSelectedGameType(gameType);
              setShowCreateTournament(true);
            }}
          />
          {selectedClassroomId && (
            <CreateTournamentModal
              open={showCreateTournament}
              onOpenChange={setShowCreateTournament}
              classroomId={selectedClassroomId}
              gameType={selectedGameType}
            />
          )}
        </>
      </div>
    );
  }

  if (view === 'match' && currentMatch) {
    return (
      <MatchPlayground
        match={currentMatch}
        tournamentPlayerId={userPlayer.id}
        onMatchEnd={() => {
          setView('lobby');
          setCurrentMatch(null);
        }}
      />
    );
  }

  return (
    <TournamentLobby
      tournament={tournament}
      userPlayer={userPlayer}
      onMatchStart={(match) => {
        setCurrentMatch(match);
        setView('match');
      }}
    />
  );
};

export default JeopardyGame;
