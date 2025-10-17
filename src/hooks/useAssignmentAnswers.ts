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
      console.log('📝 [useAssignmentAnswers] Saving answer:', {
        submissionId,
        questionId,
        answerType,
        status,
        hasQuestionData: !!questionData,
      });
      // Auto-grade if it's a reading comprehension with multiple choice
      let finalAnswerData = answerData;
      let auraRecordId: string | null = null;

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

      // Extract AURA record ID from speaking answers
      if (answerType === 'speaking' && typeof answerData === 'string') {
        try {
          const parsed = JSON.parse(answerData);
          if (parsed.auraRecordId) {
            auraRecordId = parsed.auraRecordId;
          }
        } catch (e) {
          // If not JSON, it's a simple answer
        }
      }

      const { data, error } = await supabase
        .from('assignment_answers')
        .upsert({
          submission_id: submissionId,
          question_id: questionId,
          answer_type: answerType,
          answer_data: finalAnswerData,
          status,
          aura_record_id: auraRecordId,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [useAssignmentAnswers] Save failed:', error);
        throw error;
      }
      
      console.log('✅ [useAssignmentAnswers] Answer saved successfully');
      return data;
    },
    onSuccess: () => {
      console.log('✅ [useAssignmentAnswers] Answer saved, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['assignment-answers'] });
    },
    onError: (error: any) => {
      console.error('❌ [useAssignmentAnswers] Save answer error:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      toast({
        title: 'Failed to Save Answer',
        description: error?.message || 'Unable to save your answer. Please try again.',
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
