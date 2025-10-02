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

const JeopardyGame = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const tournamentId = searchParams.get('tournament');
  const [tournament, setTournament] = useState<any>(null);
  const [userPlayer, setUserPlayer] = useState<any>(null);
  const [currentMatch, setCurrentMatch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'lobby' | 'match'>('lobby');

  const { tournaments, matches, matchStates } = useTournamentRealtime(tournamentId || undefined);

  useEffect(() => {
    if (tournamentId) {
      loadTournamentData();
    } else {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    if (tournaments.length > 0 && tournamentId) {
      const updatedTournament = tournaments.find(t => t.id === tournamentId);
      if (updatedTournament) {
        setTournament(updatedTournament);
      }
    }
  }, [tournaments, tournamentId]);

  useEffect(() => {
    if (matches.length > 0 && userPlayer) {
      const activeMatch = matches.find(
        m => (m.player_a === userPlayer.id || m.player_b === userPlayer.id) &&
             (m.status === 'waiting' || m.status === 'in_progress')
      );
      if (activeMatch && activeMatch.status === 'in_progress') {
        setCurrentMatch(activeMatch);
        setView('match');
      }
    }
  }, [matches, userPlayer]);

  const loadTournamentData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*, classroom:classrooms(*)')
        .eq('id', tournamentId)
        .single();

      if (tournamentError) throw tournamentError;
      setTournament(tournamentData);

      const { data: playerData } = await supabase
        .from('tournament_players')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('profile_id', session.user.id)
        .single();

      if (playerData) {
        setUserPlayer(playerData);
      }
    } catch (error: any) {
      console.error('Error loading tournament:', error);
      toast({
        title: "Error",
        description: "Failed to load tournament",
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
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex p-4 rounded-full bg-gradient-primary mb-4">
                <Trophy className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Jeopardy Duel
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Challenge your classmates in epic trivia showdowns!
              </p>

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

              <Button
                className="bg-gradient-primary hover:opacity-90"
                onClick={() => navigate('/student/dashboard')}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </main>
        <Footer />
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
