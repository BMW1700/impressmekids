import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, Minus, Eye } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SingleClassroomGradebookProps {
  classroomId: string;
  studentId: string;
  classroomName?: string;
}

interface ClassroomGradeData {
  finalGrade: number | null;
  currentGrade: number | null;
  categoryBreakdown: {
    test: { average: number; weight: number; count: number };
    quiz: { average: number; weight: number; count: number };
    homework: { average: number; weight: number; count: number };
    attendance: { percentage: number; weight: number };
  };
  attendanceAverage: number | null;
  daysPresent: number;
  daysTardy: number;
  daysAbsent: number;
  totalDaysRecorded: number;
  assignments: {
    id: string;
    title: string;
    dueDate: string;
    status: "Graded" | "Submitted" | "Incomplete" | "Past Due" | "Submitted Late";
    grade: number | null;
    category: string;
    pointsEarned: number | null;
    totalPoints: number;
    submissionId: string | null;
    teacherFeedback: string | null;
    passageText: string | null;
  }[];
  upcomingAssignments: {
    id: string;
    title: string;
    dueDate: string;
    status: string;
  }[];
}

const useSingleClassroomGradebook = (classroomId: string, studentId: string) => {
  return useQuery({
    queryKey: ["single-classroom-gradebook", classroomId, studentId],
    queryFn: async (): Promise<ClassroomGradeData> => {
      // Fetch all data in parallel
      const [syllabusResult, assignmentsResult, attendanceResult] = await Promise.all([
        supabase
          .from("classroom_syllabus")
          .select("grade_weights")
          .eq("classroom_id", classroomId)
          .maybeSingle(),
        
        supabase
          .from("assignments")
          .select(`
            id,
            title,
            due_date,
            category,
            passage_text,
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
          .eq("classroom_id", classroomId)
          .eq("is_posted", true)
          .order("due_date", { ascending: true }),
        
        supabase
          .from("attendance_records")
          .select("status")
          .eq("classroom_id", classroomId)
          .eq("student_id", studentId)
      ]);

      if (assignmentsResult.error) throw assignmentsResult.error;

      const weights = syllabusResult.data?.grade_weights 
        ? (syllabusResult.data.grade_weights as any)
        : { test: 35, quiz: 30, homework: 25, attendance: 10, behavior: 0 };

      const assignments = assignmentsResult.data || [];
      const attendanceRecords = attendanceResult.data || [];

      // Calculate grades
      let totalPoints = 0;
      let earnedPoints = 0;
      let gradedCount = 0;

      const testAssignments: any[] = [];
      const quizAssignments: any[] = [];
      const homeworkAssignments: any[] = [];

      const assignmentsList = assignments.map((assignment) => {
        const assignmentTotalPoints = assignment.assignment_questions?.reduce(
          (sum: number, q: any) => sum + (q.points || 0), 0
        ) || 100;
        
        const studentSubmissions = assignment.assignment_submissions.filter(
          (sub: any) => sub.student_id === studentId
        );
        const submission = studentSubmissions.find((sub: any) => sub.grade !== null) 
          || studentSubmissions[0];

        let assignmentPointsEarned: number | null = null;
        if (submission?.assignment_answers) {
          assignmentPointsEarned = submission.assignment_answers.reduce(
            (sum: number, a: any) => sum + (a.points_earned || 0), 0
          );
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
            
            const assignmentData = { grade: submission.grade, category: assignment.category };
            if (assignment.category === "Test") testAssignments.push(assignmentData);
            else if (assignment.category === "Quiz") quizAssignments.push(assignmentData);
            else if (assignment.category === "Homework") homeworkAssignments.push(assignmentData);
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
          pointsEarned: assignmentPointsEarned,
          totalPoints: assignmentTotalPoints,
        };
      });

      const currentGrade = gradedCount > 0 ? (earnedPoints / totalPoints) * 100 : null;

      const calculateCategoryAverage = (categoryAssignments: any[]) => {
        if (categoryAssignments.length === 0) return 0;
        return categoryAssignments.reduce((acc, a) => acc + a.grade, 0) / categoryAssignments.length;
      };

      const testAvg = calculateCategoryAverage(testAssignments);
      const quizAvg = calculateCategoryAverage(quizAssignments);
      const homeworkAvg = calculateCategoryAverage(homeworkAssignments);

      // Attendance
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
      const attendanceAverage = totalDaysRecorded > 0 ? attendancePoints / totalDaysRecorded : null;
      const attendancePercentage = attendanceAverage || 0;

      // Weighted final grade
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

      const upcomingAssignments = assignmentsList
        .filter((a) => a.status === "Incomplete" && a.dueDate && new Date(a.dueDate) >= new Date())
        .slice(0, 5)
        .map((a) => ({
          id: a.id,
          title: a.title,
          dueDate: a.dueDate,
          status: a.status,
        }));

      return {
        finalGrade,
        currentGrade,
        categoryBreakdown: {
          test: { average: testAvg, weight: weights.test, count: testAssignments.length },
          quiz: { average: quizAvg, weight: weights.quiz, count: quizAssignments.length },
          homework: { average: homeworkAvg, weight: weights.homework, count: homeworkAssignments.length },
          attendance: { percentage: attendancePercentage, weight: weights.attendance },
        },
        attendanceAverage,
        daysPresent,
        daysTardy,
        daysAbsent,
        totalDaysRecorded,
        assignments: assignmentsList,
        upcomingAssignments,
      };
    },
    enabled: !!classroomId && !!studentId,
    staleTime: 60000, // 1 minute cache
  });
};

export const SingleClassroomGradebook = ({ classroomId, studentId, classroomName }: SingleClassroomGradebookProps) => {
  const { data: gradeData, isLoading } = useSingleClassroomGradebook(classroomId, studentId);
  const navigate = useNavigate();
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!gradeData) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">No gradebook data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      Graded: { variant: "default", label: "Graded" },
      Submitted: { variant: "secondary", label: "Submitted" },
      Incomplete: { variant: "outline", label: "Incomplete" },
      "Past Due": { variant: "destructive", label: "Past Due" },
      "Submitted Late": { variant: "destructive", label: "Submitted Late" },
    };
    const config = variants[status] || variants.Incomplete;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/80 backdrop-blur-sm shadow-lg border-border/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {classroomName && <CardTitle className="text-xl">{classroomName}</CardTitle>}
              <div className="flex items-center gap-4 mt-2">
                {gradeData.finalGrade !== null ? (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Final Grade (Weighted)</div>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-primary">
                        {gradeData.finalGrade.toFixed(1)}%
                      </span>
                      {gradeData.finalGrade >= 90 ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : gradeData.finalGrade >= 70 ? (
                        <Minus className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">No grades yet</span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Category Breakdown */}
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/50">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium">Tests</div>
              <div className="text-lg font-bold text-foreground">
                {gradeData.categoryBreakdown.test.average.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {gradeData.categoryBreakdown.test.weight}% weight • {gradeData.categoryBreakdown.test.count} graded
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium">Quizzes</div>
              <div className="text-lg font-bold text-foreground">
                {gradeData.categoryBreakdown.quiz.average.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {gradeData.categoryBreakdown.quiz.weight}% weight • {gradeData.categoryBreakdown.quiz.count} graded
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium">Homework</div>
              <div className="text-lg font-bold text-foreground">
                {gradeData.categoryBreakdown.homework.average.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {gradeData.categoryBreakdown.homework.weight}% weight • {gradeData.categoryBreakdown.homework.count} graded
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium">Attendance</div>
              <div className="text-lg font-bold text-foreground">
                {gradeData.categoryBreakdown.attendance.percentage.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {gradeData.categoryBreakdown.attendance.weight}% weight
              </div>
            </div>
          </div>
        </CardContent>

        {gradeData.upcomingAssignments.length > 0 && (
          <CardContent>
            <h3 className="font-semibold mb-3">Upcoming Assignments</h3>
            <div className="space-y-2">
              {gradeData.upcomingAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{assignment.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Due {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  {getStatusBadge(assignment.status)}
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Attendance Summary - Inline */}
      {gradeData.attendanceAverage !== null && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
          <h4 className="text-lg font-semibold mb-3">Attendance</h4>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-blue-600">
              {gradeData.attendanceAverage.toFixed(1)}%
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Present: {gradeData.daysPresent} days
                </span>
                <Badge className="bg-green-500 hover:bg-green-600">Present</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Tardy: {gradeData.daysTardy} days
                </span>
                <Badge className="bg-yellow-500 hover:bg-yellow-600">Tardy</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Absent: {gradeData.daysAbsent} days
                </span>
                <Badge variant="destructive">Absent</Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Assignments - Inline */}
      {gradeData.assignments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">All Assignments</h3>
          {gradeData.assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg bg-card"
            >
              <div className="flex-1">
                <p className="font-semibold">{assignment.title}</p>
                <p className="text-sm text-muted-foreground">
                  {assignment.dueDate ? `Due: ${format(new Date(assignment.dueDate), "MMM d, yyyy")}` : "No due date"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {getStatusBadge(assignment.status)}
                {assignment.grade !== null && (
                  <div className="text-right">
                    <span className="text-lg font-bold text-primary">
                      {assignment.grade.toFixed(1)}%
                    </span>
                    {assignment.pointsEarned !== null && (
                      <div className="text-xs text-muted-foreground">
                        {assignment.pointsEarned}/{assignment.totalPoints} pts
                      </div>
                    )}
                  </div>
                )}
                {assignment.status === "Graded" && (
                  <Button size="sm" variant="outline" onClick={() => setSelectedAssignment(assignment)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assignment Details Dialog */}
      <Dialog open={!!selectedAssignment} onOpenChange={() => setSelectedAssignment(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedAssignment.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedAssignment.dueDate ? `Due: ${format(new Date(selectedAssignment.dueDate), "MMMM d, yyyy")}` : "No due date"}
                </p>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                {getStatusBadge(selectedAssignment.status)}
                {selectedAssignment.grade !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Your Grade</p>
                    <p className="text-2xl font-bold text-primary">
                      {selectedAssignment.grade.toFixed(1)}%
                    </p>
                    {selectedAssignment.pointsEarned !== null && (
                      <p className="text-sm text-muted-foreground">
                        {selectedAssignment.pointsEarned}/{selectedAssignment.totalPoints} points
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Teacher Feedback</h4>
                  {selectedAssignment.teacherFeedback ? (
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {selectedAssignment.teacherFeedback}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic">No feedback provided yet.</p>
                  )}
                </div>

                {selectedAssignment.submissionId && selectedAssignment.status === "Graded" && (
                  <Button
                    onClick={() => {
                      const hasPassage = selectedAssignment.passageText;
                      if (hasPassage) {
                        navigate(`/student/review-annotations/${selectedAssignment.submissionId}`);
                      } else {
                        navigate(`/student/review-submission/${selectedAssignment.submissionId}`);
                      }
                    }}
                    className="w-full"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Full Submission
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
