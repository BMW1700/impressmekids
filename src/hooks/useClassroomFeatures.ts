import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TOOLKIT_FEATURES } from "@/config/toolkitFeatures";

interface ClassroomFeature {
  id: string;
  classroom_id: string;
  feature_id: string;
  is_enabled: boolean;
  enabled_at: string;
}

export const useClassroomFeatures = (classroomId: string | undefined) => {
  const queryClient = useQueryClient();

  // Fetch enabled features for this classroom
  const { data: enabledFeatures, isLoading } = useQuery({
    queryKey: ["classroom-features", classroomId],
    queryFn: async () => {
      if (!classroomId) return [];
      
      const { data, error } = await supabase
        .from("classroom_features")
        .select("*")
        .eq("classroom_id", classroomId)
        .eq("is_enabled", true);

      if (error) throw error;
      return (data || []) as ClassroomFeature[];
    },
    enabled: !!classroomId,
  });

  // Get array of enabled feature IDs
  const enabledFeatureIds = enabledFeatures?.map((f) => f.feature_id) || [];

  // Check if a specific feature is enabled
  const isFeatureEnabled = (featureId: string): boolean => {
    return enabledFeatureIds.includes(featureId);
  };

  // Enable a feature
  const enableFeature = useMutation({
    mutationFn: async (featureId: string) => {
      if (!classroomId) throw new Error("No classroom ID");

      const { error } = await supabase.from("classroom_features").upsert(
        {
          classroom_id: classroomId,
          feature_id: featureId,
          is_enabled: true,
          enabled_at: new Date().toISOString(),
        },
        { onConflict: "classroom_id,feature_id" }
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classroom-features", classroomId] });
    },
  });

  // Disable a feature
  const disableFeature = useMutation({
    mutationFn: async (featureId: string) => {
      if (!classroomId) throw new Error("No classroom ID");

      const { error } = await supabase
        .from("classroom_features")
        .update({ is_enabled: false })
        .eq("classroom_id", classroomId)
        .eq("feature_id", featureId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classroom-features", classroomId] });
    },
  });

  // Toggle a feature
  const toggleFeature = (featureId: string) => {
    if (isFeatureEnabled(featureId)) {
      disableFeature.mutate(featureId);
    } else {
      enableFeature.mutate(featureId);
    }
  };

  return {
    enabledFeatures,
    enabledFeatureIds,
    isLoading,
    isFeatureEnabled,
    enableFeature,
    disableFeature,
    toggleFeature,
    toolkitFeatures: TOOLKIT_FEATURES,
  };
};
