import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAssignments = (classroomId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['assignments', classroomId],
    queryFn: async () => {
      if (!classroomId) return [];

      const { data, error } = await supabase
        .from('assignments')
        .select('*')
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
      .channel('assignments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments',
          filter: `classroom_id=eq.${classroomId}`,
        },
        (payload) => {
          console.log('Assignment change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['assignments', classroomId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classroomId, queryClient]);

  const createAssignment = useMutation({
    mutationFn: async ({
      classroomId,
      teacherId,
      title,
      description,
      passageText,
      passageMetadata,
      dueDate,
      status,
      enableRealtimeCoaching,
    }: {
      classroomId: string;
      teacherId: string;
      title: string;
      description?: string;
      passageText: string;
      passageMetadata?: any;
      dueDate?: Date;
      status: string;
      enableRealtimeCoaching?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          classroom_id: classroomId,
          teacher_id: teacherId,
          title,
          description,
          passage_text: passageText,
          passage_metadata: passageMetadata || {},
          due_date: dueDate?.toISOString(),
          status,
          is_posted: status === 'published',
          enable_realtime_coaching: enableRealtimeCoaching || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast({
        title: "Success",
        description: "Assignment created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create assignment.",
        variant: "destructive",
      });
      console.error('Create assignment error:', error);
    },
  });

  const updateAssignment = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<{
        title: string;
        description: string;
        passage_text: string;
        due_date: string;
        status: string;
      }>;
    }) => {
      const { data, error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast({
        title: "Success",
        description: "Assignment updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update assignment.",
        variant: "destructive",
      });
      console.error('Update assignment error:', error);
    },
  });

  return {
    assignments,
    isLoading,
    createAssignment: createAssignment.mutate,
    updateAssignment: updateAssignment.mutate,
  };
};
