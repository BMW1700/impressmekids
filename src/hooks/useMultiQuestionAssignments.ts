import { useEffect } from "react";
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
  max_attempts?: number;
  is_group_assignment?: boolean;
  status?: 'draft' | 'published';
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

  // Real-time subscription for assignment changes
  useEffect(() => {
    if (!classroomId) return;

    const channel = supabase
      .channel('multi-question-assignments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments',
          filter: `classroom_id=eq.${classroomId}`,
        },
        (payload) => {
          console.log('Multi-question assignment change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['multi-question-assignments', classroomId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classroomId, queryClient]);

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

  // Real-time subscription for assignment questions changes
  useEffect(() => {
    if (!assignmentId) return;

    const channel = supabase
      .channel('assignment-questions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignment_questions',
          filter: `assignment_id=eq.${assignmentId}`,
        },
        (payload) => {
          console.log('Assignment questions change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['multi-question-assignment', assignmentId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [assignmentId, queryClient]);

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
          max_attempts: data.max_attempts || 1,
          question_count: data.questions.length,
          status: data.status || 'draft',
          is_posted: data.status === 'published',
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
      if (updates.max_attempts !== undefined) updateData.max_attempts = updates.max_attempts;
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

  // Toggle assignment status (publish/unpublish)
  const toggleAssignmentStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: 'draft' | 'published' }) => {
      const { error } = await supabase
        .from('assignments')
        .update({ 
          status: newStatus,
          is_posted: newStatus === 'published'
        })
        .eq('id', id);

      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['multi-question-assignments'] });
      toast({
        title: 'Success',
        description: newStatus === 'published' 
          ? 'Assignment published - now visible to students' 
          : 'Assignment unpublished - hidden from students',
      });
    },
    onError: (error) => {
      console.error('Toggle assignment status error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update assignment status',
        variant: 'destructive',
      });
    },
  });

  // Delete assignment
  const deleteAssignment = useMutation({
    mutationFn: async (id: string) => {
      // Delete questions first (cascade should handle this, but explicit is safer)
      await supabase
        .from('assignment_questions')
        .delete()
        .eq('assignment_id', id);

      // Delete assignment
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multi-question-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast({
        title: 'Success',
        description: 'Assignment deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Delete assignment error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete assignment',
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
    toggleAssignmentStatus: toggleAssignmentStatus.mutate,
    deleteAssignment: deleteAssignment.mutate,
  };
};
