import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useStudentGroup = (assignmentId?: string, studentId?: string) => {
  const { data: group, isLoading } = useQuery({
    queryKey: ['student-group', assignmentId, studentId],
    queryFn: async () => {
      if (!assignmentId || !studentId) return null;

      const { data: groupMember, error } = await supabase
        .from('assignment_group_members')
        .select(`
          group_id,
          assignment_groups!inner (
            id,
            group_name,
            assignment_id
          )
        `)
        .eq('student_id', studentId)
        .eq('assignment_groups.assignment_id', assignmentId)
        .maybeSingle();

      if (error) throw error;
      if (!groupMember) return null;

      // Fetch all group members
      const { data: members, error: membersError } = await supabase
        .from('assignment_group_members')
        .select('id, group_id, student_id, joined_at')
        .eq('group_id', groupMember.group_id);

      if (membersError) throw membersError;

      // Fetch profiles
      const studentIds = members.map(m => m.student_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds);

      const membersWithProfiles = members.map(m => ({
        ...m,
        profiles: profiles?.find(p => p.id === m.student_id) || { full_name: 'Unknown' }
      }));

      return {
        id: groupMember.group_id,
        group_name: groupMember.assignment_groups.group_name,
        assignment_id: groupMember.assignment_groups.assignment_id,
        assignment_group_members: membersWithProfiles,
      };
    },
    enabled: !!assignmentId && !!studentId,
  });

  return { group, isLoading };
};
