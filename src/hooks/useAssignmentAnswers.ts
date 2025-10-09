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
      questionData,
    }: {
      submissionId: string;
      questionId: string;
      answerType: 'question_answer' | 'reading_comprehension' | 'speaking';
      answerData: any;
      status: 'not_attempted' | 'in_progress' | 'completed';
      questionData?: any;
    }) => {
      // Auto-grade if it's a reading comprehension with multiple choice
      let finalAnswerData = answerData;
      if (answerType === 'reading_comprehension' && questionData?.questions) {
        const questions = questionData.questions;
        const answers = answerData.answers || [];
        let correctCount = 0;

        questions.forEach((q: any, idx: number) => {
          if (q.type === 'multiple_choice' && q.correct_answer) {
            if (answers[idx] === q.correct_answer) {
              correctCount++;
            }
          }
        });

        finalAnswerData = {
          ...answerData,
          score: correctCount,
          total: questions.length,
        };
      }

      const { data, error } = await supabase
        .from('assignment_answers')
        .upsert({
          submission_id: submissionId,
          question_id: questionId,
          answer_type: answerType,
          answer_data: finalAnswerData,
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
