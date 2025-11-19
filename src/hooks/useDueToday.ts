import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";

export const useDueToday = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ["due-today", studentId],
    queryFn: async () => {
      if (!studentId) throw new Error("Student ID required");

      const today = new Date();
      const startDate = startOfDay(today).toISOString();
      const endDate = endOfDay(today).toISOString();

      // Get student's classrooms
      const { data: classroomData, error: classroomError } = await supabase
        .from("classroom_students")
        .select("classroom_id")
        .eq("student_id", studentId);

      if (classroomError) throw classroomError;

      const classroomIds = classroomData.map((c) => c.classroom_id);

      // Get assignments due today
      const { data: dueToday, error: dueTodayError } = await supabase
        .from("assignments")
        .select(`
          id,
          title,
          due_date,
          classroom_id,
          classrooms (
            name
          ),
          assignment_submissions (
            id,
            status
          )
        `)
        .in("classroom_id", classroomIds)
        .gte("due_date", startDate)
        .lte("due_date", endDate)
        .eq("is_posted", true);

      if (dueTodayError) throw dueTodayError;

      // Get past due assignments
      const { data: pastDue, error: pastDueError } = await supabase
        .from("assignments")
        .select(`
          id,
          title,
          due_date,
          classroom_id,
          classrooms (
            name
          ),
          assignment_submissions (
            id,
            status
          )
        `)
        .in("classroom_id", classroomIds)
        .lt("due_date", startDate)
        .eq("is_posted", true);

      if (pastDueError) throw pastDueError;

      // Filter out completed assignments
      const filterIncomplete = (assignments: any[]) =>
        assignments.filter((assignment) => {
          const submission = assignment.assignment_submissions?.[0];
          return !submission || submission.status === "not_started";
        });

      return {
        dueToday: filterIncomplete(dueToday || []),
        pastDue: filterIncomplete(pastDue || []),
      };
    },
    enabled: !!studentId,
  });
};
