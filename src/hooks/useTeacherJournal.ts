import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type MoodType = 'amazing' | 'good' | 'okay' | 'stressed' | 'tough';

export interface JournalEntry {
  id: string;
  teacher_id: string;
  classroom_id: string | null;
  entry_date: string;
  mood: MoodType;
  energy_level: number | null;
  note: string | null;
  gratitude: string | null;
  win_of_the_day: string | null;
  created_at: string;
  updated_at: string;
}

export const useTeacherJournal = (classroomId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch journal entries
  const { data: entries, isLoading } = useQuery({
    queryKey: ['teacher-journal', classroomId],
    queryFn: async () => {
      let query = supabase
        .from('teacher_journal_entries')
        .select('*')
        .order('entry_date', { ascending: false })
        .limit(30);

      if (classroomId) {
        query = query.eq('classroom_id', classroomId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as JournalEntry[];
    },
  });

  // Get today's entry
  const todayEntry = entries?.find(
    (e) => e.entry_date === new Date().toISOString().split('T')[0]
  );

  // Create or update entry
  const saveMutation = useMutation({
    mutationFn: async (entry: {
      mood: MoodType;
      energy_level?: number;
      note?: string;
      gratitude?: string;
      win_of_the_day?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const today = new Date().toISOString().split('T')[0];

      // Check if entry exists for today
      const { data: existing } = await supabase
        .from('teacher_journal_entries')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('entry_date', today)
        .eq('classroom_id', classroomId || null)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('teacher_journal_entries')
          .update({
            mood: entry.mood,
            energy_level: entry.energy_level,
            note: entry.note,
            gratitude: entry.gratitude,
            win_of_the_day: entry.win_of_the_day,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('teacher_journal_entries')
          .insert({
            teacher_id: user.id,
            classroom_id: classroomId || null,
            mood: entry.mood,
            energy_level: entry.energy_level,
            note: entry.note,
            gratitude: entry.gratitude,
            win_of_the_day: entry.win_of_the_day,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-journal'] });
      toast({
        title: "Journal Updated",
        description: "Your entry has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get mood stats for the last 7 days
  const moodStats = entries?.slice(0, 7).reduce(
    (acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    },
    {} as Record<MoodType, number>
  );

  return {
    entries: entries || [],
    todayEntry,
    moodStats,
    isLoading,
    saveEntry: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
};

export const useTeacherGameScores = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch high scores
  const { data: scores, isLoading } = useQuery({
    queryKey: ['teacher-game-scores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_game_scores')
        .select('*')
        .order('score', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Get personal best
  const { data: personalBest } = useQuery({
    queryKey: ['teacher-game-personal-best'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('teacher_game_scores')
        .select('*')
        .eq('teacher_id', user.id)
        .order('score', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Save score
  const saveScore = useMutation({
    mutationFn: async ({ gameType, score }: { gameType: string; score: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('teacher_game_scores')
        .insert({
          teacher_id: user.id,
          game_type: gameType,
          score,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-game-scores'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-game-personal-best'] });
      
      if (personalBest && data.score > personalBest.score) {
        toast({
          title: "New Personal Best! 🎉",
          description: `You scored ${data.score} points!`,
        });
      }
    },
  });

  return {
    scores: scores || [],
    personalBest,
    isLoading,
    saveScore: saveScore.mutate,
  };
};
