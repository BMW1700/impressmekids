import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id?: string;
  sequence: number;
  question_type: 'question_answer' | 'reading_comprehension' | 'speaking';
  question_data: any;
}

interface CreateAssignmentData {
  title: string;
  description?: string;
  classroom_id: string;
  due_date?: string;
  timer_minutes?: number;
  questions: Omit<Question, 'id'>[];
}

export const useMultiQuestionAssignments = (classroomId?: string, assignmentId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch assignments for a classroom
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['multi-question-assignments', classroomId],
    queryFn: async () => {
      if (!classroomId) return [];

      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          assignment_questions(*)
        `)
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!classroomId,
  });

  // Fetch single assignment with questions
  const { data: assignment, isLoading: assignmentLoading } = useQuery({
    queryKey: ['multi-question-assignment', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return null;

      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          assignment_questions(*)
        `)
        .eq('id', assignmentId)
        .single();

      if (error) throw error;
      
      // Sort questions by sequence
      if (data?.assignment_questions) {
        data.assignment_questions.sort((a: any, b: any) => a.sequence - b.sequence);
      }
      
      return data;
    },
    enabled: !!assignmentId,
  });

  // Create assignment with questions
  const createAssignment = useMutation({
    mutationFn: async (data: CreateAssignmentData) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) throw new Error('Not authenticated');

      // Create assignment
      const { data: newAssignment, error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          title: data.title,
          description: data.description,
          classroom_id: data.classroom_id,
          teacher_id: session.session.user.id,
          due_date: data.due_date,
          timer_minutes: data.timer_minutes,
          question_count: data.questions.length,
          status: 'draft',
          assignment_type: 'multi_question',
          passage_text: '', // Required field for backward compatibility
        } as any)
        .select()
        .single();

      if (assignmentError) throw assignmentError;

      // Create questions
      const questionsToInsert = data.questions.map((q) => ({
        assignment_id: newAssignment.id,
        sequence: q.sequence,
        question_type: q.question_type,
        question_data: q.question_data,
      }));

      const { error: questionsError } = await supabase
        .from('assignment_questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      return newAssignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multi-question-assignments'] });
      toast({
        title: 'Success',
        description: 'Assignment created successfully',
      });
    },
    onError: (error) => {
      console.error('Create assignment error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create assignment',
        variant: 'destructive',
      });
    },
  });

  // Update assignment and questions
  const updateAssignment = useMutation({
    mutationFn: async ({ id, updates, questions }: {
      id: string;
      updates: Partial<CreateAssignmentData>;
      questions?: Question[];
    }) => {
      // Update assignment
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.due_date !== undefined) updateData.due_date = updates.due_date;
      if (updates.timer_minutes !== undefined) updateData.timer_minutes = updates.timer_minutes;
      if (questions !== undefined) updateData.question_count = questions.length;

      const { error: assignmentError } = await supabase
        .from('assignments')
        .update(updateData)
        .eq('id', id);

      if (assignmentError) throw assignmentError;

      // If questions provided, update them
      if (questions) {
        // Delete existing questions
        await supabase
          .from('assignment_questions')
          .delete()
          .eq('assignment_id', id);

        // Insert new questions
        const questionsToInsert = questions.map((q) => ({
          assignment_id: id,
          sequence: q.sequence,
          question_type: q.question_type,
          question_data: q.question_data,
        }));

        const { error: questionsError } = await supabase
          .from('assignment_questions')
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multi-question-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['multi-question-assignment'] });
      toast({
        title: 'Success',
        description: 'Assignment updated successfully',
      });
    },
    onError: (error) => {
      console.error('Update assignment error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update assignment',
        variant: 'destructive',
      });
    },
  });

  // Publish assignment
  const publishAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('assignments')
        .update({ status: 'published' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multi-question-assignments'] });
      toast({
        title: 'Success',
        description: 'Assignment published successfully',
      });
    },
    onError: (error) => {
      console.error('Publish assignment error:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish assignment',
        variant: 'destructive',
      });
    },
  });

  return {
    assignments: assignments || [],
    assignment,
    isLoading: assignmentsLoading || assignmentLoading,
    createAssignment: createAssignment.mutate,
    updateAssignment: updateAssignment.mutate,
    publishAssignment: publishAssignment.mutate,
  };
};
