import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useTeacherNotes = (studentId?: string, classroomId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notes
  const { data: notes, isLoading } = useQuery({
    queryKey: ['teacher-notes', studentId, classroomId],
    queryFn: async () => {
      if (!studentId || !classroomId) return [];

      const { data, error } = await supabase
        .from('teacher_student_notes')
        .select('*')
        .eq('student_id', studentId)
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId && !!classroomId,
  });

  // Create note
  const createNote = useMutation({
    mutationFn: async ({ 
      content, 
      noteType, 
      audioUrl 
    }: { 
      content: string; 
      noteType: 'text' | 'voice' | 'system';
      audioUrl?: string;
    }) => {
      if (!studentId || !classroomId) throw new Error('Missing student or classroom ID');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('teacher_student_notes')
        .insert({
          teacher_id: user.id,
          student_id: studentId,
          classroom_id: classroomId,
          note_type: noteType,
          content,
          audio_url: audioUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-notes', studentId, classroomId] });
      toast({
        title: "Note Added",
        description: "Your note has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Save Note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    notes: notes || [],
    isLoading,
    createNote: createNote.mutate,
    isCreating: createNote.isPending,
  };
};
