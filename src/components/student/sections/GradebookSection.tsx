import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStudentGradebook } from "@/hooks/useStudentGradebook";
import { Loader2, TrendingUp, TrendingDown, Minus, Eye } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StandardsProgressSection } from "./StandardsProgressSection";

interface GradebookSectionProps {
  studentId: string;
}

export const GradebookSection = ({ studentId }: GradebookSectionProps) => {
  const { data: gradebook, isLoading } = useStudentGradebook(studentId);
  const navigate = useNavigate();
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(null);
  const [showAllGrades, setShowAllGrades] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
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

  const selectedClassData = gradebook?.find((c) => c.id === selectedClassroom);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Gradebook</h1>

      {gradebook && gradebook.length > 0 ? (
        <div className="space-y-6">
          {gradebook.map((classroom) => (
            <>
              <StandardsProgressSection
                key={`standards-${classroom.id}`}
                studentId={studentId}
                classroomId={classroom.id}
              />
              <Card key={classroom.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl">{classroom.name}</CardTitle>
                    <div className="flex items-center gap-4 mt-2">
                      {classroom.finalGrade !== null ? (
                        <>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Final Grade (Weighted)</div>
                            <div className="flex items-center gap-2">
                              <span className="text-3xl font-bold text-primary">
                                {classroom.finalGrade.toFixed(1)}%
                              </span>
                              {classroom.finalGrade >= 90 ? (
                                <TrendingUp className="h-5 w-5 text-green-500" />
                              ) : classroom.finalGrade >= 70 ? (
                                <Minus className="h-5 w-5 text-yellow-500" />
                              ) : (
                                <TrendingDown className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">No grades yet</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedClassroom(classroom.id)}
                    >
                      View Trend
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowAllGrades(classroom.id)}
                    >
                      View All Grades
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Category Breakdown */}
              {classroom.categoryBreakdown && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground font-medium">Tests</div>
                      <div className="text-lg font-bold text-foreground">
                        {classroom.categoryBreakdown.test.average.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {classroom.categoryBreakdown.test.weight}% weight • {classroom.categoryBreakdown.test.count} graded
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground font-medium">Quizzes</div>
                      <div className="text-lg font-bold text-foreground">
                        {classroom.categoryBreakdown.quiz.average.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {classroom.categoryBreakdown.quiz.weight}% weight • {classroom.categoryBreakdown.quiz.count} graded
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground font-medium">Homework</div>
                      <div className="text-lg font-bold text-foreground">
                        {classroom.categoryBreakdown.homework.average.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {classroom.categoryBreakdown.homework.weight}% weight • {classroom.categoryBreakdown.homework.count} graded
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground font-medium">Attendance</div>
                      <div className="text-lg font-bold text-foreground">
                        {classroom.categoryBreakdown.attendance.percentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {classroom.categoryBreakdown.attendance.weight}% weight
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}

              {classroom.upcomingAssignments.length > 0 && (
                <CardContent>
                  <h3 className="font-semibold mb-3">Upcoming Assignments</h3>
                  <div className="space-y-2">
                    {classroom.upcomingAssignments.map((assignment) => (
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
            </>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No gradebook data available yet.</p>
          </CardContent>
        </Card>
      )}

      {/* Trend Graph Dialog */}
      <Dialog open={!!selectedClassroom} onOpenChange={() => setSelectedClassroom(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Grade Trend - {selectedClassData?.name}</DialogTitle>
          </DialogHeader>
          {selectedClassData && selectedClassData.gradeHistory.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedClassData.gradeHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), "MMM d")}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    labelFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="grade"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="My Grade"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Not enough data to show grade trends yet.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* All Grades Dialog */}
      <Dialog open={!!showAllGrades} onOpenChange={() => setShowAllGrades(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              All Grades - {gradebook?.find((c) => c.id === showAllGrades)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Attendance Summary */}
            {gradebook?.find((c) => c.id === showAllGrades)?.attendanceAverage !== null && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span>Attendance</span>
                </h4>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-blue-600">
                    {gradebook?.find((c) => c.id === showAllGrades)?.attendanceAverage?.toFixed(1)}%
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Present: {gradebook?.find((c) => c.id === showAllGrades)?.daysPresent} days
                      </span>
                      <Badge className="bg-green-500 hover:bg-green-600">
                        Present
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Tardy: {gradebook?.find((c) => c.id === showAllGrades)?.daysTardy} days
                      </span>
                      <Badge className="bg-yellow-500 hover:bg-yellow-600">
                        Tardy
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Absent: {gradebook?.find((c) => c.id === showAllGrades)?.daysAbsent} days
                      </span>
                      <Badge variant="destructive">Absent</Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Assignments List */}
            {gradebook
              ?.find((c) => c.id === showAllGrades)
              ?.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-semibold">{assignment.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(assignment.status)}
                    {assignment.grade !== null && (
                      <span className="text-lg font-bold text-primary">
                        {assignment.grade.toFixed(1)}%
                      </span>
                    )}
                    {assignment.status === "Graded" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedAssignment(assignment)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>

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
                  Due: {format(new Date(selectedAssignment.dueDate), "MMMM d, yyyy")}
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
                    <p className="text-muted-foreground italic">
                      No teacher feedback provided yet.
                    </p>
                  )}
                </div>

                {selectedAssignment.submissionId && 
                 (selectedAssignment.status === "Graded" || selectedAssignment.status === "Submitted") && (
                  <Button 
                    onClick={() => navigate(`/student/assignment/${selectedAssignment.id}`)}
                    className="w-full"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Submission
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
