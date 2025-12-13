import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RubricLevel {
  id: string;
  criteria_id: string;
  name: string;
  description: string | null;
  points: number;
  sequence: number;
}

interface RubricCriteria {
  id: string;
  rubric_id: string;
  name: string;
  description: string | null;
  max_points: number;
  sequence: number;
  levels?: RubricLevel[];
}

interface Rubric {
  id: string;
  classroom_id: string;
  created_by: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  criteria?: RubricCriteria[];
}

interface RubricScore {
  id: string;
  submission_id: string;
  criteria_id: string;
  level_id: string | null;
  points_awarded: number;
  feedback: string | null;
}

export const useRubrics = (classroomId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rubrics, isLoading } = useQuery({
    queryKey: ['rubrics', classroomId],
    queryFn: async () => {
      if (!classroomId) return [];

      const { data, error } = await supabase
        .from('rubrics')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Rubric[];
    },
    enabled: !!classroomId,
  });

  const createRubric = useMutation({
    mutationFn: async ({ title, description }: { title: string; description?: string }) => {
      if (!classroomId) throw new Error('Missing classroom ID');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('rubrics')
        .insert({
          classroom_id: classroomId,
          created_by: user.id,
          title,
          description,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubrics', classroomId] });
      toast({ title: "Rubric Created", description: "Rubric created successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteRubric = useMutation({
    mutationFn: async (rubricId: string) => {
      const { error } = await supabase
        .from('rubrics')
        .delete()
        .eq('id', rubricId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubrics', classroomId] });
      toast({ title: "Rubric Deleted" });
    },
  });

  return {
    rubrics: rubrics || [],
    isLoading,
    createRubric: createRubric.mutate,
    deleteRubric: deleteRubric.mutate,
    isCreating: createRubric.isPending,
  };
};

export const useRubricDetail = (rubricId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rubric, isLoading } = useQuery({
    queryKey: ['rubric-detail', rubricId],
    queryFn: async () => {
      if (!rubricId) return null;

      const { data: rubricData, error: rubricError } = await supabase
        .from('rubrics')
        .select('*')
        .eq('id', rubricId)
        .single();

      if (rubricError) throw rubricError;

      const { data: criteriaData, error: criteriaError } = await supabase
        .from('rubric_criteria')
        .select('*')
        .eq('rubric_id', rubricId)
        .order('sequence');

      if (criteriaError) throw criteriaError;

      const criteriaWithLevels = await Promise.all((criteriaData || []).map(async (criteria) => {
        const { data: levels } = await supabase
          .from('rubric_levels')
          .select('*')
          .eq('criteria_id', criteria.id)
          .order('sequence');

        return { ...criteria, levels: levels || [] };
      }));

      return { ...rubricData, criteria: criteriaWithLevels } as Rubric;
    },
    enabled: !!rubricId,
  });

  const addCriteria = useMutation({
    mutationFn: async ({ name, description, maxPoints }: { name: string; description?: string; maxPoints: number }) => {
      if (!rubricId) throw new Error('Missing rubric ID');

      const { data: existing } = await supabase
        .from('rubric_criteria')
        .select('sequence')
        .eq('rubric_id', rubricId)
        .order('sequence', { ascending: false })
        .limit(1);

      const nextSequence = existing && existing.length > 0 ? existing[0].sequence + 1 : 0;

      const { data, error } = await supabase
        .from('rubric_criteria')
        .insert({
          rubric_id: rubricId,
          name,
          description,
          max_points: maxPoints,
          sequence: nextSequence,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-create 4 default levels
      const defaultLevels = [
        { name: 'Excellent', points: maxPoints, sequence: 0 },
        { name: 'Good', points: Math.round(maxPoints * 0.75), sequence: 1 },
        { name: 'Fair', points: Math.round(maxPoints * 0.5), sequence: 2 },
        { name: 'Poor', points: Math.round(maxPoints * 0.25), sequence: 3 },
      ];

      await supabase.from('rubric_levels').insert(
        defaultLevels.map(level => ({ ...level, criteria_id: data.id }))
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubric-detail', rubricId] });
    },
  });

  const updateCriteria = useMutation({
    mutationFn: async ({ criteriaId, name, description, maxPoints }: { criteriaId: string; name?: string; description?: string; maxPoints?: number }) => {
      const { error } = await supabase
        .from('rubric_criteria')
        .update({ name, description, max_points: maxPoints })
        .eq('id', criteriaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubric-detail', rubricId] });
    },
  });

  const deleteCriteria = useMutation({
    mutationFn: async (criteriaId: string) => {
      const { error } = await supabase
        .from('rubric_criteria')
        .delete()
        .eq('id', criteriaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubric-detail', rubricId] });
    },
  });

  const updateLevel = useMutation({
    mutationFn: async ({ levelId, name, description, points }: { levelId: string; name?: string; description?: string; points?: number }) => {
      const { error } = await supabase
        .from('rubric_levels')
        .update({ name, description, points })
        .eq('id', levelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubric-detail', rubricId] });
    },
  });

  return {
    rubric,
    isLoading,
    addCriteria: addCriteria.mutate,
    updateCriteria: updateCriteria.mutate,
    deleteCriteria: deleteCriteria.mutate,
    updateLevel: updateLevel.mutate,
  };
};

export const useRubricScores = (submissionId?: string) => {
  const queryClient = useQueryClient();

  const { data: scores, isLoading } = useQuery({
    queryKey: ['rubric-scores', submissionId],
    queryFn: async () => {
      if (!submissionId) return [];

      const { data, error } = await supabase
        .from('rubric_scores')
        .select('*')
        .eq('submission_id', submissionId);

      if (error) throw error;
      return data as RubricScore[];
    },
    enabled: !!submissionId,
  });

  const saveScore = useMutation({
    mutationFn: async ({ criteriaId, levelId, pointsAwarded, feedback }: { criteriaId: string; levelId?: string; pointsAwarded: number; feedback?: string }) => {
      if (!submissionId) throw new Error('Missing submission ID');

      const { error } = await supabase
        .from('rubric_scores')
        .upsert({
          submission_id: submissionId,
          criteria_id: criteriaId,
          level_id: levelId || null,
          points_awarded: pointsAwarded,
          feedback,
        }, {
          onConflict: 'submission_id,criteria_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubric-scores', submissionId] });
    },
  });

  return {
    scores: scores || [],
    isLoading,
    saveScore: saveScore.mutate,
  };
};

export const useAssignmentRubric = (assignmentId?: string) => {
  const queryClient = useQueryClient();

  const { data: assignmentRubric, isLoading } = useQuery({
    queryKey: ['assignment-rubric', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return null;

      const { data, error } = await supabase
        .from('assignment_rubrics')
        .select('*, rubric:rubrics(*)')
        .eq('assignment_id', assignmentId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!assignmentId,
  });

  const attachRubric = useMutation({
    mutationFn: async (rubricId: string) => {
      if (!assignmentId) throw new Error('Missing assignment ID');

      // Remove existing if any
      await supabase
        .from('assignment_rubrics')
        .delete()
        .eq('assignment_id', assignmentId);

      const { error } = await supabase
        .from('assignment_rubrics')
        .insert({
          assignment_id: assignmentId,
          rubric_id: rubricId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-rubric', assignmentId] });
    },
  });

  const detachRubric = useMutation({
    mutationFn: async () => {
      if (!assignmentId) throw new Error('Missing assignment ID');

      const { error } = await supabase
        .from('assignment_rubrics')
        .delete()
        .eq('assignment_id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-rubric', assignmentId] });
    },
  });

  return {
    assignmentRubric,
    isLoading,
    attachRubric: attachRubric.mutate,
    detachRubric: detachRubric.mutate,
  };
};
