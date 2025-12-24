import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";

export const useDueToday = (studentId: string | undefined, classroomIds?: string[]) => {
  return useQuery({
    queryKey: ["due-today", studentId, classroomIds?.join(",")],
    queryFn: async () => {
      if (!studentId) throw new Error("Student ID required");

      const today = new Date();
      const startDate = startOfDay(today).toISOString();
      const endDate = endOfDay(today).toISOString();

      // Use provided classroom IDs or fetch them
      let cids = classroomIds;
      if (!cids || cids.length === 0) {
        const { data: classroomData, error: classroomError } = await supabase
          .from("classroom_students")
          .select("classroom_id")
          .eq("student_id", studentId);

        if (classroomError) throw classroomError;
        cids = classroomData?.map((c) => c.classroom_id) || [];
      }

      if (cids.length === 0) {
        return { dueToday: [], pastDue: [] };
      }

      // Fetch both in parallel - simpler query without deep joins
      const [dueTodayResult, pastDueResult] = await Promise.all([
        supabase
          .from("assignments")
          .select(`
            id,
            title,
            due_date,
            classroom_id,
            classrooms (name)
          `)
          .in("classroom_id", cids)
          .gte("due_date", startDate)
          .lte("due_date", endDate)
          .eq("is_posted", true),
        
        supabase
          .from("assignments")
          .select(`
            id,
            title,
            due_date,
            classroom_id,
            classrooms (name)
          `)
          .in("classroom_id", cids)
          .lt("due_date", startDate)
          .eq("is_posted", true)
          .limit(20), // Limit past due to avoid huge payloads
      ]);

      if (dueTodayResult.error) throw dueTodayResult.error;
      if (pastDueResult.error) throw pastDueResult.error;

      // Get submission status for these assignments in one query
      const allAssignmentIds = [
        ...(dueTodayResult.data || []).map(a => a.id),
        ...(pastDueResult.data || []).map(a => a.id),
      ];

      const { data: submissions } = await supabase
        .from("assignment_submissions")
        .select("assignment_id, status")
        .eq("student_id", studentId)
        .in("assignment_id", allAssignmentIds);

      const submissionMap = new Map(
        (submissions || []).map(s => [s.assignment_id, s.status])
      );

      // Filter out completed assignments
      const filterIncomplete = (assignments: any[]) =>
        assignments.filter((assignment) => {
          const status = submissionMap.get(assignment.id);
          return !status || status === "not_started" || status === "in_progress";
        });

      return {
        dueToday: filterIncomplete(dueTodayResult.data || []),
        pastDue: filterIncomplete(pastDueResult.data || []),
      };
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minute cache
  });
};
