import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Users, Play, Crown } from "lucide-react";
import { useTournamentRealtime } from "@/hooks/useTournamentRealtime";
import { useToast } from "@/hooks/use-toast";

interface TournamentLobbyProps {
  tournament: any;
  userPlayer: any;
  onMatchStart: (match: any) => void;
}

export const TournamentLobby = ({ tournament, userPlayer, onMatchStart }: TournamentLobbyProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const { matches: realtimeMatches } = useTournamentRealtime(tournament.id);

  useEffect(() => {
    loadLobbyData();
  }, [tournament.id]);

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
      const { data: playersData, error: playersError } = await supabase
        .from('tournament_players')
        .select('*, profile:profiles(*)')
        .eq('tournament_id', tournament.id)
        .order('seed', { ascending: true });

      if (playersError) throw playersError;
      setPlayers(playersData || []);

      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
          player_a_data:tournament_players!matches_player_a_fkey(profile:profiles(*)),
          player_b_data:tournament_players!matches_player_b_fkey(profile:profiles(*))
        `)
        .eq('tournament_id', tournament.id)
        .order('round', { ascending: true });

      if (matchesError) throw matchesError;
      setMatches(matchesData || []);
    } catch (error) {
      console.error('Error loading lobby data:', error);
      toast({
        title: "Error",
        description: "Failed to load tournament data",
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
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

            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Players
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{players.length}</div>
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
                    <p className="text-muted-foreground text-center py-8">
                      No matches created yet. Waiting for tournament to start...
                    </p>
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
    </div>
  );
};
