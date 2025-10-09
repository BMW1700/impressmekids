import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Highlight {
  id: string;
  submission_id: string;
  student_id: string;
  start_offset: number;
  end_offset: number;
  highlighted_text: string;
  annotation: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export const useTextHighlights = (submissionId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: highlights, isLoading } = useQuery({
    queryKey: ['text-highlights', submissionId],
    queryFn: async () => {
      if (!submissionId) return [];

      const { data, error } = await supabase
        .from('text_highlights')
        .select('*')
        .eq('submission_id', submissionId)
        .order('start_offset', { ascending: true });

      if (error) throw error;
      return (data || []) as Highlight[];
    },
    enabled: !!submissionId,
  });

  const createHighlight = useMutation({
    mutationFn: async ({
      submissionId,
      studentId,
      startOffset,
      endOffset,
      highlightedText,
      annotation,
      color,
    }: {
      submissionId: string;
      studentId: string;
      startOffset: number;
      endOffset: number;
      highlightedText: string;
      annotation: string;
      color: string;
    }) => {
      const { data, error } = await supabase
        .from('text_highlights')
        .insert({
          submission_id: submissionId,
          student_id: studentId,
          start_offset: startOffset,
          end_offset: endOffset,
          highlighted_text: highlightedText,
          annotation,
          color,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Highlight;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['text-highlights'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save highlight.",
        variant: "destructive",
      });
      console.error('Create highlight error:', error);
    },
  });

  const updateHighlight = useMutation({
    mutationFn: async ({
      id,
      annotation,
    }: {
      id: string;
      annotation: string;
    }) => {
      const { data, error } = await supabase
        .from('text_highlights')
        .update({ annotation })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Highlight;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['text-highlights'] });
      toast({
        title: "Success",
        description: "Annotation updated!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update annotation.",
        variant: "destructive",
      });
      console.error('Update highlight error:', error);
    },
  });

  const deleteHighlight = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('text_highlights')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['text-highlights'] });
      toast({
        title: "Success",
        description: "Highlight removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete highlight.",
        variant: "destructive",
      });
      console.error('Delete highlight error:', error);
    },
  });

  return {
    highlights: highlights || [],
    isLoading,
    createHighlight: createHighlight.mutate,
    updateHighlight: updateHighlight.mutate,
    deleteHighlight: deleteHighlight.mutate,
  };
};
