import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy } from "lucide-react";
import { BuzzButton } from "./BuzzButton";
import { MatchTimer } from "./MatchTimer";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface MatchPlaygroundProps {
  match: any;
  tournamentPlayerId: string;
  onMatchEnd: () => void;
}

export const MatchPlayground = ({ match, tournamentPlayerId, onMatchEnd }: MatchPlaygroundProps) => {
  const { toast } = useToast();
  const [matchState, setMatchState] = useState<any>(null);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [opponent, setOpponent] = useState<any>(null);
  
  const hasTimerExpiredRef = useRef(false);
  const currentQuestionIdRef = useRef<string | null>(null);

  // Initial load and controlled polling
  useEffect(() => {
    loadMatchData();
    hasTimerExpiredRef.current = false;
    currentQuestionIdRef.current = null;
    
    // Simple controlled polling - only during active match
    if (match.status !== 'completed') {
      const pollInterval = setInterval(() => {
        loadMatchData();
      }, 3000); // 3-second poll for match updates
      
      return () => clearInterval(pollInterval);
    }
  }, [match.id, match.status]);

  const loadMatchData = async () => {
    try {
      const opponentId = match.player_a === tournamentPlayerId ? match.player_b : match.player_a;
      const { data: opponentData } = await supabase
        .from('tournament_players')
        .select('*, profile:profiles(*)')
        .eq('id', opponentId)
        .single();

      if (opponentData) {
        setOpponent(opponentData);
      }

      // Load match_state
      const { data: stateData } = await supabase
        .from('match_state')
        .select('*')
        .eq('match_id', match.id)
        .single();
      
      if (stateData) {
        setMatchState(stateData);
        
        // Load match_events
        const { data: eventsData } = await supabase
          .from('match_events')
          .select('*')
          .eq('match_id', match.id)
          .order('seq');
        
        if (eventsData) {
          const currentEvent = eventsData.find((e: any) => e.seq === stateData.current_seq);
          if (currentEvent) {
            setCurrentEvent(currentEvent);
            // Only load question if it's a NEW question (guard against redundant loads)
            if (currentEvent.question_id !== currentQuestionIdRef.current) {
              currentQuestionIdRef.current = currentEvent.question_id;
              loadQuestion(currentEvent.question_id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading match data:', error);
    }
  };

  const loadQuestion = async (questionId: string) => {
    // Guard: Don't reload if we already have this exact question
    if (question?.id === questionId) {
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single();

      if (error) throw error;
      setQuestion(data);
    } catch (error) {
      console.error('Error loading question:', error);
    }
  };

  const handleBuzz = async () => {
    if (!currentEvent || !matchState) return;

    try {
      const { data, error } = await supabase.functions.invoke('buzz-in', {
        body: {
          match_id: match.id,
          seq: currentEvent.seq,
          tournament_player_id: tournamentPlayerId,
        },
      });

      if (error) throw error;

      if (!data.success) {
        toast({
          title: "Too late!",
          description: data.error || "Someone else buzzed in first",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Buzz error:', error);
      toast({
        title: "Error",
        description: "Failed to buzz in",
        variant: "destructive",
      });
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !currentEvent) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-answer', {
        body: {
          match_id: match.id,
          seq: currentEvent.seq,
          tournament_player_id: tournamentPlayerId,
          answer_text: answer.trim(),
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: data.correct ? "Correct! 🎉" : "Incorrect",
          description: data.correct 
            ? `+${data.points_awarded} points!` 
            : "Your opponent gets a chance to answer",
          variant: data.correct ? "default" : "destructive",
        });
        setAnswer("");
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      toast({
        title: "Error",
        description: "Failed to submit answer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimerExpire = useCallback(async () => {
    // Guard: prevent multiple calls and check if match is already completed
    if (hasTimerExpiredRef.current || match.status === 'completed') {
      console.log('⏰ Timer expire skipped (already handled or match completed)');
      return;
    }
    
    hasTimerExpiredRef.current = true;
    console.log('⏰ Timer expired for match:', match.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('end-round-and-compute-winners', {
        body: {
          tournament_id: match.tournament_id,
          round_number: match.round,
        },
      });

      if (error) throw error;

      if (data?.winner_id) {
        const isWinner = data.winner_id === tournamentPlayerId;
        toast({
          title: isWinner ? "You Won! 🎉" : "Match Over",
          description: isWinner 
            ? "You're advancing to the next round!" 
            : "Better luck next time!",
          variant: isWinner ? "default" : "destructive",
          duration: 3000,
        });
         
        // Give backend time to update match & tournament state before leaving
        setTimeout(() => {
          onMatchEnd();
        }, 2000);
       }
     } catch (error: any) {
       console.error('Timer expire error:', error);
     }
   }, [match.id, match.status, match.tournament_id, match.round, tournamentPlayerId, onMatchEnd, toast]);

  if (!matchState || !question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isMyTurn = currentEvent?.buzz_owner_tournament_player_id === tournamentPlayerId;
  const canBuzz = matchState.accepting_buzz && !currentEvent?.buzz_owner_tournament_player_id;
  const myScore = match.player_a === tournamentPlayerId ? match.score_a : match.score_b;
  const opponentScore = match.player_a === tournamentPlayerId ? match.score_b : match.score_a;

  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuthButtons={false} />
      
      <main className="flex-1 py-8 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Score Bar */}
            <Card className="mb-6 shadow-card">
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">You</div>
                    <div className="text-3xl font-bold text-primary">{myScore}</div>
                  </div>
                  <div className="text-center">
                    <MatchTimer 
                      roundEndsAt={matchState.round_ends_at} 
                      onExpire={handleTimerExpire}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">{opponent?.profile?.full_name || 'Opponent'}</div>
                    <div className="text-3xl font-bold text-secondary">{opponentScore}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Question Card */}
            <Card className="mb-6 shadow-purple">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Question {matchState.current_seq}</CardTitle>
                  <Badge>{question.difficulty}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xl mb-4">{question.question_text}</p>
                {question.image_url && (
                  <img 
                    src={question.image_url} 
                    alt="Question" 
                    className="rounded-lg max-h-64 mx-auto mb-4"
                  />
                )}
              </CardContent>
            </Card>

            {/* Buzz/Answer Section */}
            <Card className="shadow-card">
              <CardContent className="p-8">
                {canBuzz && (
                  <div className="text-center">
                    <BuzzButton
                      onBuzz={handleBuzz}
                      canBuzz={canBuzz}
                    />
                  </div>
                )}

                {isMyTurn && currentEvent && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <Badge variant="default" className="text-lg px-4 py-2">
                        Your Turn!
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer..."
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                        disabled={isSubmitting}
                        className="text-lg"
                      />
                      <Button
                        onClick={handleSubmitAnswer}
                        disabled={!answer.trim() || isSubmitting}
                        size="lg"
                        className="bg-gradient-primary hover:opacity-90"
                      >
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Submit'}
                      </Button>
                    </div>
                  </div>
                )}

                {!canBuzz && !isMyTurn && currentEvent?.buzz_owner_tournament_player_id && (
                  <div className="text-center">
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {currentEvent.buzz_owner_tournament_player_id === tournamentPlayerId 
                        ? 'Waiting for answer...' 
                        : 'Opponent is answering...'}
                    </Badge>
                  </div>
                )}

                {!currentEvent && (
                  <div className="text-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Loading next question...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {match.status === 'completed' && (
              <div className="mt-6 text-center">
                <Button onClick={onMatchEnd} className="bg-gradient-primary hover:opacity-90">
                  <Trophy className="mr-2 h-5 w-5" />
                  Back to Lobby
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
