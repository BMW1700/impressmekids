import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useQLearningUpdate = () => {
  const { toast } = useToast();

  const updateQLearning = async (
    exerciseId: string,
    studentId: string,
    performance: {
      success_rate: number;
      completed_phonemes: string[];
    }
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('update-q-learning', {
        body: { exerciseId, studentId, performance },
      });

      if (error) throw error;

      console.log('Q-learning updated:', data);
      return data;
    } catch (error) {
      console.error('Failed to update Q-learning:', error);
      toast({
        title: "Learning Update Failed",
        description: "Could not update adaptive learning model",
        variant: "destructive",
      });
      return null;
    }
  };

  return { updateQLearning };
};
