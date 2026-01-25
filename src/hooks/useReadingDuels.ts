import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ReadingDuel {
  id: string;
  classroom_id: string;
  challenger_id: string;
  opponent_id: string | null;
  passage_text: string;
  passage_title: string;
  passage_word_count: number;
  status: 'waiting' | 'accepted' | 'in_progress' | 'completed' | 'expired' | 'declined';
  challenger_words_read: number;
  challenger_accuracy: number;
  challenger_time_seconds: number | null;
  challenger_best_streak: number;
  challenger_score: number;
  challenger_completed_at: string | null;
  opponent_words_read: number;
  opponent_accuracy: number;
  opponent_time_seconds: number | null;
  opponent_best_streak: number;
  opponent_score: number;
  opponent_completed_at: string | null;
  winner_id: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface DuelStats {
  id: string;
  student_id: string;
  total_duels: number;
  wins: number;
  losses: number;
  draws: number;
  current_win_streak: number;
  best_win_streak: number;
  total_xp_from_duels: number;
  total_gold_from_duels: number;
  created_at: string;
  updated_at: string;
}

export interface ClassmateInfo {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export const useReadingDuels = (studentId: string, classroomId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get pending challenges (waiting for you to accept)
  const pendingChallenges = useQuery({
    queryKey: ['pending-duels', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_duels')
        .select('*')
        .eq('opponent_id', studentId)
        .eq('status', 'waiting')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ReadingDuel[];
    },
    enabled: !!studentId,
    staleTime: 30000, // 30 seconds
  });

  // Get outgoing challenges (challenges you sent)
  const outgoingChallenges = useQuery({
    queryKey: ['outgoing-duels', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_duels')
        .select('*')
        .eq('challenger_id', studentId)
        .in('status', ['waiting', 'accepted'])
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ReadingDuel[];
    },
    enabled: !!studentId,
    staleTime: 30000,
  });

  // Get active duels (duels you need to complete)
  const activeDuels = useQuery({
    queryKey: ['active-duels', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_duels')
        .select('*')
        .or(`challenger_id.eq.${studentId},opponent_id.eq.${studentId}`)
        .in('status', ['accepted', 'in_progress'])
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter to duels where user hasn't completed yet
      return (data || []).filter((duel: ReadingDuel) => {
        if (duel.challenger_id === studentId) {
          return !duel.challenger_completed_at;
        } else {
          return !duel.opponent_completed_at;
        }
      }) as ReadingDuel[];
    },
    enabled: !!studentId,
    staleTime: 30000,
  });

  // Get duel history
  const duelHistory = useQuery({
    queryKey: ['duel-history', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_duels')
        .select('*')
        .or(`challenger_id.eq.${studentId},opponent_id.eq.${studentId}`)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as ReadingDuel[];
    },
    enabled: !!studentId,
    staleTime: 60000,
  });

  // Get duel stats
  const duelStats = useQuery({
    queryKey: ['duel-stats', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('duel_stats')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) throw error;
      return data as DuelStats | null;
    },
    enabled: !!studentId,
    staleTime: 60000,
  });

  // Get classmates for challenging
  const classmates = useQuery({
    queryKey: ['duel-classmates', studentId, classroomId],
    queryFn: async () => {
      if (!classroomId) return [];

      const { data, error } = await supabase
        .from('classroom_students')
        .select(`
          student_id,
          profiles:student_id (
            id,
            full_name
          ),
          public_profiles:student_id (
            avatar_url,
            display_name
          )
        `)
        .eq('classroom_id', classroomId)
        .neq('student_id', studentId);

      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        id: item.student_id,
        display_name: item.public_profiles?.display_name || item.profiles?.full_name || 'Student',
        avatar_url: item.public_profiles?.avatar_url,
      })) as ClassmateInfo[];
    },
    enabled: !!studentId && !!classroomId,
    staleTime: 120000,
  });

  // Create a new challenge
  const createChallenge = useMutation({
    mutationFn: async ({ 
      opponentId, 
      passageText, 
      passageTitle,
      passageWordCount,
      classroomId: cId 
    }: { 
      opponentId: string; 
      passageText: string; 
      passageTitle: string;
      passageWordCount: number;
      classroomId: string;
    }) => {
      const { data, error } = await supabase
        .from('reading_duels')
        .insert({
          challenger_id: studentId,
          opponent_id: opponentId,
          passage_text: passageText,
          passage_title: passageTitle,
          passage_word_count: passageWordCount,
          classroom_id: cId,
          status: 'waiting',
        })
        .select()
        .single();

      if (error) throw error;
      return data as ReadingDuel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outgoing-duels'] });
      toast({
        title: "Challenge Sent! ⚔️",
        description: "Your opponent has 24 hours to accept.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send challenge",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Accept a challenge
  const acceptChallenge = useMutation({
    mutationFn: async (duelId: string) => {
      const { data, error } = await supabase
        .from('reading_duels')
        .update({ status: 'accepted' })
        .eq('id', duelId)
        .eq('opponent_id', studentId)
        .select()
        .single();

      if (error) throw error;
      return data as ReadingDuel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-duels'] });
      queryClient.invalidateQueries({ queryKey: ['active-duels'] });
      toast({
        title: "Challenge Accepted! 🎯",
        description: "Complete your reading to win!",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to accept challenge",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Decline a challenge
  const declineChallenge = useMutation({
    mutationFn: async (duelId: string) => {
      const { data, error } = await supabase
        .from('reading_duels')
        .update({ status: 'declined' })
        .eq('id', duelId)
        .eq('opponent_id', studentId)
        .select()
        .single();

      if (error) throw error;
      return data as ReadingDuel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-duels'] });
      toast({
        title: "Challenge Declined",
        description: "The duel has been declined.",
      });
    },
  });

  // Submit duel result
  const submitDuelResult = useMutation({
    mutationFn: async ({
      duelId,
      wordsRead,
      accuracy,
      timeSeconds,
      bestStreak,
    }: {
      duelId: string;
      wordsRead: number;
      accuracy: number;
      timeSeconds: number;
      bestStreak: number;
    }) => {
      // Get the current duel
      const { data: duel, error: fetchError } = await supabase
        .from('reading_duels')
        .select('*')
        .eq('id', duelId)
        .single();

      if (fetchError) throw fetchError;

      const isChallenger = duel.challenger_id === studentId;
      const score = Math.round(accuracy * 50 + (300 / Math.max(timeSeconds, 1)) * 30 + bestStreak * 20);

      const updateData: Record<string, any> = isChallenger
        ? {
            challenger_words_read: wordsRead,
            challenger_accuracy: accuracy,
            challenger_time_seconds: timeSeconds,
            challenger_best_streak: bestStreak,
            challenger_score: score,
            challenger_completed_at: new Date().toISOString(),
          }
        : {
            opponent_words_read: wordsRead,
            opponent_accuracy: accuracy,
            opponent_time_seconds: timeSeconds,
            opponent_best_streak: bestStreak,
            opponent_score: score,
            opponent_completed_at: new Date().toISOString(),
          };

      // Check if both players have completed
      const otherCompleted = isChallenger 
        ? duel.opponent_completed_at 
        : duel.challenger_completed_at;

      if (otherCompleted) {
        // Calculate winner
        const challengerScore = isChallenger ? score : duel.challenger_score;
        const opponentScore = isChallenger ? duel.opponent_score : score;

        if (challengerScore > opponentScore) {
          updateData.winner_id = duel.challenger_id;
        } else if (opponentScore > challengerScore) {
          updateData.winner_id = duel.opponent_id;
        }
        // Draw if scores equal (winner_id stays null)
        
        updateData.status = 'completed';
      } else {
        updateData.status = 'in_progress';
      }

      const { data, error } = await supabase
        .from('reading_duels')
        .update(updateData)
        .eq('id', duelId)
        .select()
        .single();

      if (error) throw error;

      // Update stats if duel is complete
      if (updateData.status === 'completed') {
        await updateDuelStats(studentId, data as ReadingDuel);
      }

      return data as ReadingDuel;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['active-duels'] });
      queryClient.invalidateQueries({ queryKey: ['duel-history'] });
      queryClient.invalidateQueries({ queryKey: ['duel-stats'] });

      if (data.status === 'completed') {
        const isWinner = data.winner_id === studentId;
        const isDraw = !data.winner_id;
        
        toast({
          title: isDraw ? "It's a Draw! 🤝" : isWinner ? "Victory! 🏆" : "Defeat 💪",
          description: isDraw 
            ? "You both matched perfectly!" 
            : isWinner 
              ? "You won the reading duel!" 
              : "Keep practicing for next time!",
        });
      } else {
        toast({
          title: "Result Submitted! ⏳",
          description: "Waiting for your opponent to complete...",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to submit result",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    pendingChallenges,
    outgoingChallenges,
    activeDuels,
    duelHistory,
    duelStats,
    classmates,
    createChallenge,
    acceptChallenge,
    declineChallenge,
    submitDuelResult,
  };
};

// Helper function to update duel stats
async function updateDuelStats(studentId: string, duel: ReadingDuel) {
  const isChallenger = duel.challenger_id === studentId;
  const isWinner = duel.winner_id === studentId;
  const isDraw = !duel.winner_id;
  const isLoser = duel.winner_id && duel.winner_id !== studentId;

  // Get current stats or create new
  const { data: existingStats } = await supabase
    .from('duel_stats')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();

  const currentStats = existingStats || {
    total_duels: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    current_win_streak: 0,
    best_win_streak: 0,
    total_xp_from_duels: 0,
    total_gold_from_duels: 0,
  };

  // Calculate rewards
  let xpReward = isWinner ? 50 : isDraw ? 35 : 20;
  let goldReward = isWinner ? 25 : isDraw ? 15 : 10;

  // Streak bonus
  const newWinStreak = isWinner 
    ? currentStats.current_win_streak + 1 
    : isLoser 
      ? 0 
      : currentStats.current_win_streak;

  if (isWinner && newWinStreak > 1) {
    xpReward += newWinStreak * 10; // Streak bonus
  }

  const newStats = {
    student_id: studentId,
    total_duels: currentStats.total_duels + 1,
    wins: currentStats.wins + (isWinner ? 1 : 0),
    losses: currentStats.losses + (isLoser ? 1 : 0),
    draws: currentStats.draws + (isDraw ? 1 : 0),
    current_win_streak: newWinStreak,
    best_win_streak: Math.max(currentStats.best_win_streak, newWinStreak),
    total_xp_from_duels: currentStats.total_xp_from_duels + xpReward,
    total_gold_from_duels: currentStats.total_gold_from_duels + goldReward,
  };

  if (existingStats) {
    await supabase
      .from('duel_stats')
      .update(newStats)
      .eq('student_id', studentId);
  } else {
    await supabase
      .from('duel_stats')
      .insert(newStats);
  }

  // Also update campaign_progress gold/xp by fetching current values and adding
  const { data: currentProgress } = await supabase
    .from('campaign_progress')
    .select('total_gold, total_xp_earned')
    .eq('student_id', studentId)
    .maybeSingle();

  if (currentProgress) {
    await supabase
      .from('campaign_progress')
      .update({
        total_gold: (currentProgress.total_gold || 0) + goldReward,
        total_xp_earned: (currentProgress.total_xp_earned || 0) + xpReward,
      })
      .eq('student_id', studentId);
  }
}
