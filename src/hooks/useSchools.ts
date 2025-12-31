import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface School {
  id: string;
  name: string;
  district_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useSchools = (districtId?: string | null) => {
  const queryClient = useQueryClient();

  const { data: schools, isLoading } = useQuery({
    queryKey: ["schools", districtId],
    queryFn: async () => {
      let query = supabase
        .from("schools")
        .select("*")
        .order("name");
      
      // Filter by district if provided
      if (districtId) {
        query = query.eq("district_id", districtId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as School[];
    },
  });

  const createSchool = useMutation({
    mutationFn: async ({ name, districtId }: { name: string; districtId: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("schools")
        .insert({
          name,
          district_id: districtId,
          created_by: session.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      toast.success("School created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create school: ${error.message}`);
    },
  });

  const updateSchool = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from("schools")
        .update({ name })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      toast.success("School updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update school: ${error.message}`);
    },
  });

  const deleteSchool = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("schools")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      toast.success("School deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete school: ${error.message}`);
    },
  });

  const connectUserToSchool = useMutation({
    mutationFn: async ({ userId, schoolId }: { userId: string; schoolId: string | null }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ school_id: schoolId })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teachers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      queryClient.invalidateQueries({ queryKey: ["admin-admins"] });
      toast.success("User connected to school successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to connect user to school: ${error.message}`);
    },
  });

  return {
    schools,
    isLoading,
    createSchool,
    updateSchool,
    deleteSchool,
    connectUserToSchool,
  };
};
