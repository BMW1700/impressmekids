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

interface GradebookSectionProps {
  studentId: string;
}

export const GradebookSection = ({ studentId }: GradebookSectionProps) => {
  const { data: gradebook, isLoading } = useStudentGradebook(studentId);
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(null);
  const [showAllGrades, setShowAllGrades] = useState<string | null>(null);
  const navigate = useNavigate();

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
            <Card key={classroom.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{classroom.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      {classroom.currentGrade !== null ? (
                        <>
                          <span className="text-3xl font-bold text-primary">
                            {classroom.currentGrade.toFixed(1)}%
                          </span>
                          {classroom.currentGrade >= 90 ? (
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          ) : classroom.currentGrade >= 70 ? (
                            <Minus className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-500" />
                          )}
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
          <div className="space-y-3">
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/teacher/review-submission/${assignment.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
