import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDirectoryTeachers = () => {
  return useQuery({
    queryKey: ["directory-teachers"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_directory_teachers");
      if (error) throw error;
      return data;
    },
  });
};

export const useDirectoryAdmins = () => {
  return useQuery({
    queryKey: ["directory-admins"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_directory_admins");
      if (error) throw error;
      return data;
    },
  });
};
