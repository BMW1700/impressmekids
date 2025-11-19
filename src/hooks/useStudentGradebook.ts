import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GradebookClassroom {
  id: string;
  name: string;
  currentGrade: number | null;
  gradeHistory: { date: string; grade: number }[];
  classAverageHistory: { date: string; grade: number }[];
  upcomingAssignments: {
    id: string;
    title: string;
    dueDate: string;
    status: string;
  }[];
  assignments: {
    id: string;
    title: string;
    dueDate: string;
    status: "Graded" | "Submitted" | "Incomplete" | "Past Due" | "Submitted Late";
    grade: number | null;
  }[];
}

export const useStudentGradebook = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ["student-gradebook", studentId],
    queryFn: async () => {
      if (!studentId) throw new Error("Student ID required");

      // Get student's classrooms
      const { data: classrooms, error: classroomsError } = await supabase
        .from("classroom_students")
        .select(`
          classroom_id,
          classrooms (
            id,
            name
          )
        `)
        .eq("student_id", studentId);

      if (classroomsError) throw classroomsError;

      const gradebookData: GradebookClassroom[] = [];

      for (const classroom of classrooms || []) {
        // Get assignments for this classroom
        const { data: assignments, error: assignmentsError } = await supabase
          .from("assignments")
          .select(`
            id,
            title,
            due_date,
            assignment_submissions (
              id,
              grade,
              status,
              submitted_at,
              graded_at
            )
          `)
          .eq("classroom_id", classroom.classroom_id)
          .eq("is_posted", true)
          .order("due_date", { ascending: true });

        if (assignmentsError) throw assignmentsError;

        // Calculate current grade and prepare assignment data
        let totalPoints = 0;
        let earnedPoints = 0;
        let gradedCount = 0;

        const assignmentsList = (assignments || []).map((assignment) => {
          const submission = assignment.assignment_submissions.find(
            (sub: any) => sub
          );

          let status: "Graded" | "Submitted" | "Incomplete" | "Past Due" | "Submitted Late" = "Incomplete";
          
          if (submission) {
            const isLate = submission.submitted_at && assignment.due_date && 
              new Date(submission.submitted_at) > new Date(assignment.due_date);
            
            if (submission.grade !== null) {
              status = "Graded";
              totalPoints += 100; // Assuming 100 points per assignment
              earnedPoints += submission.grade;
              gradedCount++;
            } else if (isLate) {
              status = "Submitted Late";
            } else {
              status = "Submitted";
            }
          } else if (assignment.due_date && new Date(assignment.due_date) < new Date()) {
            status = "Past Due";
          }

          return {
            id: assignment.id,
            title: assignment.title,
            dueDate: assignment.due_date || "",
            status,
            grade: submission?.grade || null,
          };
        });

        // Calculate current grade
        const currentGrade = gradedCount > 0 ? (earnedPoints / totalPoints) * 100 : null;

        // Get upcoming assignments (not submitted, not past due)
        const upcomingAssignments = assignmentsList
          .filter((a) => a.status === "Incomplete" && new Date(a.dueDate) >= new Date())
          .slice(0, 5)
          .map((a) => ({
            id: a.id,
            title: a.title,
            dueDate: a.dueDate,
            status: a.status,
          }));

        // Mock grade history (in real implementation, you'd track this over time)
        const gradeHistory = gradedCount > 0
          ? [{ date: new Date().toISOString(), grade: currentGrade || 0 }]
          : [];

        gradebookData.push({
          id: classroom.classroom_id,
          name: classroom.classrooms?.name || "Unknown Classroom",
          currentGrade,
          gradeHistory,
          classAverageHistory: [], // Would need to calculate from all students
          upcomingAssignments,
          assignments: assignmentsList,
        });
      }

      return gradebookData;
    },
    enabled: !!studentId,
  });
};
