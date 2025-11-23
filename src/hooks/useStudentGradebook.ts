import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GradebookClassroom {
  id: string;
  name: string;
  currentGrade: number | null;
  finalGrade: number | null;
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
    category: string;
  }[];
  attendanceAverage: number | null;
  totalDaysRecorded: number;
  daysPresent: number;
  daysTardy: number;
  daysAbsent: number;
  categoryBreakdown?: {
    test: { average: number; weight: number; count: number };
    quiz: { average: number; weight: number; count: number };
    homework: { average: number; weight: number; count: number };
    attendance: { percentage: number; weight: number };
  };
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
        // Fetch syllabus for grade weights
        const { data: syllabus } = await supabase
          .from("classroom_syllabus")
          .select("grade_weights")
          .eq("classroom_id", classroom.classroom_id)
          .maybeSingle();

        const weights = syllabus?.grade_weights 
          ? (syllabus.grade_weights as any)
          : { test: 25, quiz: 25, homework: 25, attendance: 25 };

        // Get assignments for this classroom
        const { data: assignments, error: assignmentsError } = await supabase
          .from("assignments")
          .select(`
            id,
            title,
            due_date,
            category,
            assignment_submissions (
              id,
              grade,
              status,
              submitted_at,
              graded_at,
              teacher_feedback
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

        // Track assignments by category
        const testAssignments: any[] = [];
        const quizAssignments: any[] = [];
        const homeworkAssignments: any[] = [];

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
              totalPoints += 100;
              earnedPoints += submission.grade;
              gradedCount++;
              
              // Add to category arrays
              const assignmentData = { grade: submission.grade, category: assignment.category };
              if (assignment.category === "Test") {
                testAssignments.push(assignmentData);
              } else if (assignment.category === "Quiz") {
                quizAssignments.push(assignmentData);
              } else if (assignment.category === "Homework") {
                homeworkAssignments.push(assignmentData);
              }
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
            category: assignment.category,
            submissionId: submission?.id || null,
            teacherFeedback: submission?.teacher_feedback || null,
          };
        });

        // Calculate current grade (simple average)
        const currentGrade = gradedCount > 0 ? (earnedPoints / totalPoints) * 100 : null;

        // Calculate category averages
        const calculateCategoryAverage = (categoryAssignments: any[]) => {
          if (categoryAssignments.length === 0) return 0;
          const sum = categoryAssignments.reduce((acc, a) => acc + a.grade, 0);
          return sum / categoryAssignments.length;
        };

        const testAvg = calculateCategoryAverage(testAssignments);
        const quizAvg = calculateCategoryAverage(quizAssignments);
        const homeworkAvg = calculateCategoryAverage(homeworkAssignments);

        // Fetch attendance records for this classroom
        const { data: attendanceRecords } = await supabase
          .from("attendance_records")
          .select("status")
          .eq("classroom_id", classroom.classroom_id)
          .eq("student_id", studentId);

        // Calculate attendance metrics
        let daysPresent = 0;
        let daysTardy = 0;
        let daysAbsent = 0;

        attendanceRecords?.forEach((record) => {
          if (record.status === "Present") daysPresent++;
          else if (record.status === "Tardy") daysTardy++;
          else if (record.status === "Absent") daysAbsent++;
        });

        const totalDaysRecorded = daysPresent + daysTardy + daysAbsent;
        const attendancePoints = daysPresent * 100 + daysTardy * 100 + daysAbsent * 0;
        const attendanceAverage =
          totalDaysRecorded > 0 ? attendancePoints / totalDaysRecorded : null;
        const attendancePercentage = attendanceAverage || 0;

        // Calculate weighted final grade
        let finalGrade: number | null = null;
        if (gradedCount > 0 || totalDaysRecorded > 0) {
          let weightedSum = 0;
          let totalWeight = 0;

          // Add test contribution
          if (testAssignments.length > 0) {
            weightedSum += (testAvg * weights.test) / 100;
            totalWeight += weights.test;
          }

          // Add quiz contribution
          if (quizAssignments.length > 0) {
            weightedSum += (quizAvg * weights.quiz) / 100;
            totalWeight += weights.quiz;
          }

          // Add homework contribution
          if (homeworkAssignments.length > 0) {
            weightedSum += (homeworkAvg * weights.homework) / 100;
            totalWeight += weights.homework;
          }

          // Add attendance contribution
          if (totalDaysRecorded > 0 && weights.attendance > 0) {
            weightedSum += (attendancePercentage * weights.attendance) / 100;
            totalWeight += weights.attendance;
          }

          // Calculate final grade based on actual weights used
          if (totalWeight > 0) {
            finalGrade = (weightedSum / totalWeight) * 100;
          }
        }

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
          ? [{ date: new Date().toISOString(), grade: finalGrade || currentGrade || 0 }]
          : [];

        gradebookData.push({
          id: classroom.classroom_id,
          name: classroom.classrooms?.name || "Unknown Classroom",
          currentGrade,
          finalGrade,
          gradeHistory,
          classAverageHistory: [],
          upcomingAssignments,
          assignments: assignmentsList,
          attendanceAverage,
          totalDaysRecorded,
          daysPresent,
          daysTardy,
          daysAbsent,
          categoryBreakdown: {
            test: { average: testAvg, weight: weights.test, count: testAssignments.length },
            quiz: { average: quizAvg, weight: weights.quiz, count: quizAssignments.length },
            homework: { average: homeworkAvg, weight: weights.homework, count: homeworkAssignments.length },
            attendance: { percentage: attendancePercentage, weight: weights.attendance },
          },
        });
      }

      return gradebookData;
    },
    enabled: !!studentId,
  });
};
