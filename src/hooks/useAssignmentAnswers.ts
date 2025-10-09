import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAssignmentAnswers = (submissionId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: answers, isLoading } = useQuery({
    queryKey: ['assignment-answers', submissionId],
    queryFn: async () => {
      if (!submissionId) return [];

      const { data, error } = await supabase
        .from('assignment_answers')
        .select('*')
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!submissionId,
  });

  const saveAnswer = useMutation({
    mutationFn: async ({
      submissionId,
      questionId,
      answerType,
      answerData,
      status,
    }: {
      submissionId: string;
      questionId: string;
      answerType: 'question_answer' | 'reading_comprehension' | 'speaking';
      answerData: any;
      status: 'not_attempted' | 'in_progress' | 'completed';
    }) => {
      const { data, error } = await supabase
        .from('assignment_answers')
        .upsert({
          submission_id: submissionId,
          question_id: questionId,
          answer_type: answerType,
          answer_data: answerData,
          status,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-answers'] });
    },
    onError: (error) => {
      console.error('Save answer error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save answer',
        variant: 'destructive',
      });
    },
  });

  return {
    answers: answers || [],
    isLoading,
    saveAnswer: saveAnswer.mutate,
  };
};
