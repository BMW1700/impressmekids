import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GradebookClassroom {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
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
    pointsEarned: number | null;
    totalPoints: number;
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

      // Get student's classrooms with teacher info
      const { data: classrooms, error: classroomsError } = await supabase
        .from("classroom_students")
        .select(`
          classroom_id,
          classrooms (
            id,
            name,
            teacher_id,
            profiles!classrooms_teacher_id_fkey (
              id,
              full_name
            )
          )
        `)
        .eq("student_id", studentId);

      if (classroomsError) throw classroomsError;
      if (!classrooms || classrooms.length === 0) return [];

      const classroomIds = classrooms.map(c => c.classroom_id);

      // Fetch ALL data in parallel instead of sequentially per classroom
      const [syllabusResult, assignmentsResult, attendanceResult] = await Promise.all([
        // Fetch all syllabi for these classrooms at once
        supabase
          .from("classroom_syllabus")
          .select("classroom_id, grade_weights")
          .in("classroom_id", classroomIds),
        
        // Fetch all assignments for these classrooms at once
        supabase
          .from("assignments")
          .select(`
            id,
            title,
            due_date,
            category,
            passage_text,
            classroom_id,
            assignment_questions (
              points
            ),
            assignment_submissions (
              id,
              student_id,
              grade,
              status,
              submitted_at,
              graded_at,
              teacher_feedback,
              assignment_answers (
                points_earned
              )
            )
          `)
          .in("classroom_id", classroomIds)
          .eq("is_posted", true)
          .order("due_date", { ascending: true }),
        
        // Fetch all attendance records for these classrooms at once
        supabase
          .from("attendance_records")
          .select("classroom_id, status")
          .in("classroom_id", classroomIds)
          .eq("student_id", studentId)
      ]);

      if (assignmentsResult.error) throw assignmentsResult.error;

      // Create lookup maps for fast access
      const syllabusMap = new Map<string, any>();
      syllabusResult.data?.forEach(s => syllabusMap.set(s.classroom_id, s.grade_weights));

      const assignmentsByClassroom = new Map<string, any[]>();
      assignmentsResult.data?.forEach(a => {
        const list = assignmentsByClassroom.get(a.classroom_id) || [];
        list.push(a);
        assignmentsByClassroom.set(a.classroom_id, list);
      });

      const attendanceByClassroom = new Map<string, any[]>();
      attendanceResult.data?.forEach(a => {
        const list = attendanceByClassroom.get(a.classroom_id) || [];
        list.push(a);
        attendanceByClassroom.set(a.classroom_id, list);
      });

      // Now process each classroom using the pre-fetched data
      const gradebookData: GradebookClassroom[] = classrooms.map((classroom) => {
        const weights = syllabusMap.get(classroom.classroom_id) 
          ? (syllabusMap.get(classroom.classroom_id) as any)
          : { test: 35, quiz: 30, homework: 25, attendance: 10, behavior: 0 };

        const assignments = assignmentsByClassroom.get(classroom.classroom_id) || [];
        const attendanceRecords = attendanceByClassroom.get(classroom.classroom_id) || [];

        // Calculate current grade and prepare assignment data
        let totalPoints = 0;
        let earnedPoints = 0;
        let gradedCount = 0;

        // Track assignments by category
        const testAssignments: any[] = [];
        const quizAssignments: any[] = [];
        const homeworkAssignments: any[] = [];

        const assignmentsList = assignments.map((assignment) => {
          // Calculate total points for this assignment from questions
          const assignmentTotalPoints = assignment.assignment_questions?.reduce(
            (sum: number, q: any) => sum + (q.points || 0), 0
          ) || 100;
          
          // Filter to only this student's submissions, then prioritize graded ones
          const studentSubmissions = assignment.assignment_submissions.filter(
            (sub: any) => sub.student_id === studentId
          );
          const submission = studentSubmissions.find((sub: any) => sub.grade !== null) 
            || studentSubmissions[0];

          // Calculate points earned from answers
          let assignmentPointsEarned: number | null = null;
          if (submission?.assignment_answers) {
            const earnedFromAnswers = submission.assignment_answers.reduce(
              (sum: number, a: any) => sum + (a.points_earned || 0), 0
            );
            assignmentPointsEarned = earnedFromAnswers;
          }

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
            passageText: assignment.passage_text,
            classroomId: assignment.classroom_id,
            pointsEarned: assignmentPointsEarned,
            totalPoints: assignmentTotalPoints,
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

        // Calculate attendance metrics
        let daysPresent = 0;
        let daysTardy = 0;
        let daysAbsent = 0;

        attendanceRecords.forEach((record) => {
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

          if (testAssignments.length > 0) {
            weightedSum += (testAvg * weights.test) / 100;
            totalWeight += weights.test;
          }

          if (quizAssignments.length > 0) {
            weightedSum += (quizAvg * weights.quiz) / 100;
            totalWeight += weights.quiz;
          }

          if (homeworkAssignments.length > 0) {
            weightedSum += (homeworkAvg * weights.homework) / 100;
            totalWeight += weights.homework;
          }

          if (totalDaysRecorded > 0 && weights.attendance > 0) {
            weightedSum += (attendancePercentage * weights.attendance) / 100;
            totalWeight += weights.attendance;
          }

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

        const gradeHistory = gradedCount > 0
          ? [{ date: new Date().toISOString(), grade: finalGrade || currentGrade || 0 }]
          : [];

        return {
          id: classroom.classroom_id,
          name: classroom.classrooms?.name || "Unknown Classroom",
          teacherId: classroom.classrooms?.teacher_id || "",
          teacherName: (classroom.classrooms?.profiles as any)?.full_name || "Teacher",
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
        };
      });

      return gradebookData;
    },
    enabled: !!studentId,
    staleTime: 30000, // Cache for 30 seconds to avoid refetching on tab switches
  });
};
