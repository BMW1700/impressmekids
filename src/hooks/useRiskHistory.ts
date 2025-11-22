import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRiskHistory = (studentId: string, days: number = 30) => {
  return useQuery({
    queryKey: ["risk-history", studentId, days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("student_risk_history")
        .select("*")
        .eq("student_id", studentId)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });
};
