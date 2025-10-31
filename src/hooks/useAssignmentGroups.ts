import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface GroupMember {
  id: string;
  group_id: string;
  student_id: string;
  joined_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export interface AssignmentGroup {
  id: string;
  assignment_id: string;
  group_name: string;
  created_at: string;
  updated_at: string;
  assignment_group_members: GroupMember[];
}

export const useAssignmentGroups = (assignmentId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch groups for an assignment
  const { data: groups, isLoading } = useQuery({
    queryKey: ['assignment-groups', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return [];

      const { data, error } = await supabase
        .from('assignment_groups')
        .select(`
          *,
          assignment_group_members (
            id,
            group_id,
            student_id,
            joined_at
          )
        `)
        .eq('assignment_id', assignmentId)
        .order('group_name');

      if (error) throw error;
      
      // Fetch profile data separately for each member
      const groupsWithProfiles = await Promise.all(
        (data || []).map(async (group) => {
          const memberIds = group.assignment_group_members.map((m: any) => m.student_id);
          
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', memberIds);
          
          return {
            ...group,
            assignment_group_members: group.assignment_group_members.map((member: any) => ({
              ...member,
              profiles: profiles?.find((p) => p.id === member.student_id) || { full_name: 'Unknown', email: '' },
            })),
          };
        })
      );
      
      return groupsWithProfiles as AssignmentGroup[];
    },
    enabled: !!assignmentId,
  });

  // Create groups
  const createGroups = useMutation({
    mutationFn: async (data: { assignmentId: string; groups: { name: string; memberIds: string[] }[] }) => {
      const groupInserts = data.groups.map(group => ({
        assignment_id: data.assignmentId,
        group_name: group.name,
      }));

      const { data: createdGroups, error: groupError } = await supabase
        .from('assignment_groups')
        .insert(groupInserts)
        .select();

      if (groupError) throw groupError;

      // Add members to each group
      const memberInserts = createdGroups.flatMap((group, index) =>
        data.groups[index].memberIds.map(studentId => ({
          group_id: group.id,
          student_id: studentId,
        }))
      );

      const { error: memberError } = await supabase
        .from('assignment_group_members')
        .insert(memberInserts);

      if (memberError) throw memberError;

      return createdGroups;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-groups'] });
      toast({
        title: "Success",
        description: "Groups created successfully",
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

  // Delete a group
  const deleteGroup = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('assignment_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-groups'] });
      toast({
        title: "Success",
        description: "Group deleted successfully",
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

  return {
    groups,
    isLoading,
    createGroups: createGroups.mutate,
    deleteGroup: deleteGroup.mutate,
  };
};
