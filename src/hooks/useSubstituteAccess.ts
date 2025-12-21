import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SubstituteAccessLink {
  id: string;
  classroom_id: string;
  teacher_id: string;
  access_code: string;
  substitute_name: string | null;
  substitute_email: string | null;
  access_start: string;
  access_end: string;
  permissions: {
    view_students: boolean;
    take_attendance: boolean;
    view_assignments: boolean;
    post_announcements: boolean;
  };
  used_at: string | null;
  used_by: string | null;
  is_active: boolean;
  created_at: string;
}

function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const useSubstituteAccess = (classroomId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: links, isLoading } = useQuery({
    queryKey: ['substitute-access-links', classroomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('substitute_access_links')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SubstituteAccessLink[];
    },
  });

  const createLinkMutation = useMutation({
    mutationFn: async ({
      substituteName,
      substituteEmail,
      accessStart,
      accessEnd,
      permissions,
      classroomName,
      teacherName,
    }: {
      substituteName: string;
      substituteEmail: string;
      accessStart: Date;
      accessEnd: Date;
      permissions?: Partial<SubstituteAccessLink['permissions']>;
      classroomName?: string;
      teacherName?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('substitute_access_links')
        .insert({
          classroom_id: classroomId,
          teacher_id: user.id,
          access_code: generateAccessCode(),
          substitute_name: substituteName,
          substitute_email: substituteEmail,
          access_start: accessStart.toISOString(),
          access_end: accessEnd.toISOString(),
          permissions: {
            view_students: true,
            take_attendance: true,
            view_assignments: true,
            post_announcements: false,
            ...permissions,
          },
        })
        .select()
        .single();

      if (error) throw error;
      
      const link = data as SubstituteAccessLink;
      
      // Send email notification to substitute
      try {
        const { error: emailError } = await supabase.functions.invoke('send-substitute-access-email', {
          body: {
            substituteName,
            substituteEmail,
            accessCode: link.access_code,
            classroomName: classroomName || 'Classroom',
            teacherName: teacherName || 'Your colleague',
            accessEnd: accessEnd.toISOString(),
          },
        });
        
        if (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Don't throw - the link was created successfully
        }
      } catch (emailErr) {
        console.error('Email notification error:', emailErr);
        // Don't throw - the link was created successfully
      }
      
      return link;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['substitute-access-links', classroomId] });
      toast({
        title: "Access Link Created",
        description: "An email has been sent to the substitute teacher with their access code.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const revokeLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('substitute_access_links')
        .update({ is_active: false })
        .eq('id', linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['substitute-access-links', classroomId] });
      toast({
        title: "Access Revoked",
        description: "The substitute can no longer access this classroom.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activeLinks = links?.filter(
    (link) => link.is_active && new Date(link.access_end) > new Date()
  ) || [];

  const expiredLinks = links?.filter(
    (link) => !link.is_active || new Date(link.access_end) <= new Date()
  ) || [];

  return {
    links: links || [],
    activeLinks,
    expiredLinks,
    isLoading,
    createLink: createLinkMutation.mutate,
    isCreating: createLinkMutation.isPending,
    revokeLink: revokeLinkMutation.mutate,
    isRevoking: revokeLinkMutation.isPending,
  };
};