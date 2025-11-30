import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Loader2 } from "lucide-react";

interface Player {
  id: string;
  display_name: string;
  avatar_url?: string;
}

interface Match {
  id: string;
  round: number;
  status: string;
  score_a: number;
  score_b: number;
  player_a: string;
  player_b: string;
  winner_tournament_player_id?: string;
}

interface TournamentBracketProps {
  matches: Match[];
  players: Player[];
}

export const TournamentBracket = ({ matches, players }: TournamentBracketProps) => {
  // Group matches by round
  const matchesByRound: Record<number, Match[]> = {};
  matches.forEach(match => {
    if (!matchesByRound[match.round]) {
      matchesByRound[match.round] = [];
    }
    matchesByRound[match.round].push(match);
  });

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.display_name || 'Unknown';
  };

  const getRoundLabel = (round: number, totalRounds: number) => {
    if (round === totalRounds) return 'Finals';
    if (round === totalRounds - 1) return 'Semi-Finals';
    return `Round ${round}`;
  };

  const getMatchStatusBadge = (match: Match) => {
    if (match.status === 'completed') {
      return <Badge variant="secondary">Completed</Badge>;
    }
    if (match.status === 'in_progress') {
      return <Badge variant="default" className="animate-pulse">Live</Badge>;
    }
    return <Badge variant="outline">Waiting</Badge>;
  };

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>No matches created yet. Start the tournament to generate the bracket.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-6 overflow-x-auto pb-4">
        {rounds.map((round, roundIndex) => (
          <div key={round} className="flex-shrink-0" style={{ minWidth: '320px' }}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {getRoundLabel(round, rounds.length)}
              <span className="text-sm text-muted-foreground">
                ({matchesByRound[round].length} match{matchesByRound[round].length !== 1 ? 'es' : ''})
              </span>
            </h3>
            
            <div className="space-y-4">
              {matchesByRound[round].map((match, matchIndex) => {
                const playerAName = getPlayerName(match.player_a);
                const playerBName = getPlayerName(match.player_b);
                const isWinnerA = match.winner_tournament_player_id === match.player_a;
                const isWinnerB = match.winner_tournament_player_id === match.player_b;

                return (
                  <Card 
                    key={match.id}
                    className={`relative ${
                      match.status === 'in_progress' 
                        ? 'shadow-glow border-primary/50' 
                        : 'shadow-card'
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Match {matchIndex + 1}</CardTitle>
                        {getMatchStatusBadge(match)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {/* Player A */}
                      <div 
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                          isWinnerA 
                            ? 'bg-primary/10 border-2 border-primary' 
                            : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {isWinnerA && <Trophy className="h-4 w-4 text-primary flex-shrink-0" />}
                          <span className={`truncate ${isWinnerA ? 'font-semibold' : ''}`}>
                            {playerAName}
                          </span>
                        </div>
                        <div className={`text-xl font-bold ml-2 ${
                          match.status === 'in_progress' ? 'animate-pulse' : ''
                        }`}>
                          {match.score_a}
                        </div>
                      </div>

                      {/* Player B */}
                      <div 
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                          isWinnerB 
                            ? 'bg-primary/10 border-2 border-primary' 
                            : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {isWinnerB && <Trophy className="h-4 w-4 text-primary flex-shrink-0" />}
                          <span className={`truncate ${isWinnerB ? 'font-semibold' : ''}`}>
                            {playerBName}
                          </span>
                        </div>
                        <div className={`text-xl font-bold ml-2 ${
                          match.status === 'in_progress' ? 'animate-pulse' : ''
                        }`}>
                          {match.score_b}
                        </div>
                      </div>

                      {match.status === 'in_progress' && (
                        <div className="flex items-center justify-center gap-2 pt-2 text-xs text-primary">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Match in progress...</span>
                        </div>
                      )}
                    </CardContent>

                    {/* Connector line to next round */}
                    {roundIndex < rounds.length - 1 && (
                      <div className="absolute top-1/2 -right-6 w-6 h-0.5 bg-border" />
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
