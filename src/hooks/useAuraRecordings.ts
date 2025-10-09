import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAuraRecordings = (studentId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recordings, isLoading } = useQuery({
    queryKey: ['aura-recordings', studentId],
    queryFn: async () => {
      let query = supabase
        .from('aura_recordings')
        .select('*')
        .order('created_at', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
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
        .from('aura_recordings')
        .insert({
          student_id: studentId,
          transcription_text: transcriptionText,
          audio_url: audioUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aura-recordings'] });
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
