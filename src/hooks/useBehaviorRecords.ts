import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BehaviorCategory {
  id: string;
  classroom_id: string;
  name: string;
  point_value: number;
  category_type: 'positive' | 'negative';
  icon?: string;
  color?: string;
  is_default: boolean;
}

export interface BehaviorRecord {
  id: string;
  student_id: string;
  classroom_id: string;
  teacher_id: string;
  category_id: string;
  points: number;
  notes?: string;
  created_at: string;
  category?: BehaviorCategory;
}

export const useBehaviorRecords = (classroomId: string) => {
  const queryClient = useQueryClient();

  // Fetch behavior categories for classroom
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['behavior-categories', classroomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('behavior_categories')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('category_type', { ascending: false })
        .order('name');

      if (error) throw error;
      return data as BehaviorCategory[];
    },
    enabled: !!classroomId,
  });

  // Fetch behavior records for classroom
  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: ['behavior-records', classroomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('behavior_records')
        .select(`
          *,
          category:behavior_categories(*)
        `)
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as BehaviorRecord[];
    },
    enabled: !!classroomId,
  });

  // Add behavior record mutation
  const addRecord = useMutation({
    mutationFn: async (data: {
      student_id: string;
      category_id: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get category to determine points
      const { data: category } = await supabase
        .from('behavior_categories')
        .select('point_value')
        .eq('id', data.category_id)
        .single();

      if (!category) throw new Error('Category not found');

      const { data: record, error } = await supabase
        .from('behavior_records')
        .insert({
          student_id: data.student_id,
          classroom_id: classroomId,
          teacher_id: user.id,
          category_id: data.category_id,
          points: category.point_value,
          notes: data.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavior-records', classroomId] });
      queryClient.invalidateQueries({ queryKey: ['behavior-stats', classroomId] });
      toast.success('Behavior recorded');
    },
    onError: (error) => {
      console.error('Error adding behavior record:', error);
      toast.error('Failed to record behavior');
    },
  });

  // Seed default categories mutation
  const seedCategories = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('seed_default_behavior_categories', {
        p_classroom_id: classroomId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavior-categories', classroomId] });
      toast.success('Default categories added');
    },
    onError: (error) => {
      console.error('Error seeding categories:', error);
      toast.error('Failed to add default categories');
    },
  });

  return {
    categories,
    records,
    isLoading: categoriesLoading || recordsLoading,
    addRecord,
    seedCategories,
  };
};
