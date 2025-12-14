import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { screeningPassages, type ScreeningPassage } from "@/data/screeningPassages";

export interface ActiveScreening {
  periodId: string;
  periodName: string;
  classroomId: string;
  gradeLevel: number;
  passage: ScreeningPassage | null;
  passageId: string | null;
}

/**
 * Hook to get the active screening passage for a student
 * Checks all classrooms the student is in for active benchmark periods
 */
export const useActiveScreeningPassage = (studentId?: string) => {
  return useQuery({
    queryKey: ["active-screening-passage", studentId],
    queryFn: async (): Promise<ActiveScreening | null> => {
      if (!studentId) return null;
      
      // Get all classrooms the student is in
      const { data: enrollments, error: enrollmentError } = await supabase
        .from("classroom_students")
        .select(`
          classroom_id,
          classrooms:classroom_id (
            id,
            grade
          )
        `)
        .eq("student_id", studentId);
      
      if (enrollmentError || !enrollments?.length) return null;
      
      // Check each classroom for active benchmark periods
      for (const enrollment of enrollments) {
        const classroomId = enrollment.classroom_id;
        const gradeLevel = (enrollment.classrooms as any)?.grade || 2;
        
        const { data: activePeriod } = await supabase
          .from("benchmark_assessment_periods")
          .select("*")
          .eq("classroom_id", classroomId)
          .eq("is_active", true)
          .single();
        
        if (activePeriod) {
          // Found an active period - get the passage
          let passage: ScreeningPassage | null = null;
          
          if (activePeriod.screening_passage_id) {
            // Teacher selected a specific passage
            passage = screeningPassages.find(p => p.id === activePeriod.screening_passage_id) || null;
          }
          
          // If no specific passage or not found, get random for grade
          if (!passage) {
            const gradePassages = screeningPassages.filter(p => p.gradeLevel === gradeLevel);
            if (gradePassages.length > 0) {
              passage = gradePassages[Math.floor(Math.random() * gradePassages.length)];
            }
          }
          
          return {
            periodId: activePeriod.id,
            periodName: activePeriod.period_name,
            classroomId,
            gradeLevel,
            passage,
            passageId: passage?.id || null,
          };
        }
      }
      
      return null;
    },
    enabled: !!studentId,
    staleTime: 30000, // Cache for 30 seconds
  });
};
