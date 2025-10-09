import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAuraRecordings = (studentId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recordings, isLoading } = useQuery({
    queryKey: ['aura-records', studentId],
    queryFn: async () => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from('aura_records')
        .select('*')
        .eq('profile_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });

  const createRecording = useMutation({
    mutationFn: async ({
      studentId,
      transcriptionText,
      audioUrl,
    }: {
      studentId: string;
      transcriptionText: string;
      audioUrl?: string;
    }) => {
      const { data, error } = await supabase
        .from('aura_records')
        .insert({
          profile_id: studentId,
          transcript: transcriptionText,
          audio_url: audioUrl || '',
          language: 'en',
          duration_s: 0,
          words: 0,
          wpm: 0,
          pace: 3,
          clarity: 3,
          confidence: 3,
          pronunciation_flags: [],
          feedback: [],
          evidence: {},
          suggested_exercises: [],
          pause_count: 0,
          avg_silence_ms: 0,
          asr_confidence: 0.95,
          request_id: crypto.randomUUID(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aura-records'] });
      toast({
        title: "Success",
        description: "Recording saved successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save recording.",
        variant: "destructive",
      });
      console.error('Create recording error:', error);
    },
  });

  return {
    recordings,
    isLoading,
    createRecording: createRecording.mutate,
  };
};
