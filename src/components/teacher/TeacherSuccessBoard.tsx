import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClassroomMetrics } from "@/hooks/useClassroomMetrics";
import { useClassroomAssignmentMetrics } from "@/hooks/useClassroomAssignmentMetrics";
import { usePriorityStudents } from "@/hooks/usePriorityStudents";
import { useTeacherSummary } from "@/hooks/useTeacherSummary";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, AlertTriangle, FileText, Loader2, CheckCircle, ClipboardCheck, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TeacherSuccessBoardProps {
  classroomId: string;
}

export const TeacherSuccessBoard = ({ classroomId }: TeacherSuccessBoardProps) => {
  const { metrics, isLoading: metricsLoading } = useClassroomMetrics(classroomId);
  const { metrics: assignmentMetrics, isLoading: assignmentMetricsLoading } = useClassroomAssignmentMetrics(classroomId);
  const { urgentStudents, isLoading: studentsLoading } = usePriorityStudents();
  const { summary, generateSummary, isGenerating } = useTeacherSummary(classroomId);
  const navigate = useNavigate();

  const isLoading = metricsLoading || studentsLoading || assignmentMetricsLoading;

  const handleExportPDF = () => {
    if (!summary && classroomId) {
      generateSummary(classroomId);
    } else {
      const csvContent = [
        ['Metric', 'Value'],
        ['Avg Assignment Grade', `${assignmentMetrics?.avgGrade || 0}%`],
        ['Pending Grading', `${assignmentMetrics?.pendingGradingCount || 0}`],
        ['Completion Rate', `${assignmentMetrics?.completionRate || 0}%`],
        ['WPM Improvement', `${metrics?.wpmImprovement || 0}%`],
        ['At-Risk Students', urgentStudents.length],
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `class-summary-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader className="bg-gradient-primary text-white">
          <CardTitle className="flex items-center gap-2">
            📊 Your Class at a Glance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Parse AI-generated recommendations from summary_data
  const recommendations = (() => {
    if (!summary?.summary_data) {
      return [
        "Review at-risk students below",
        "Schedule individual check-ins",
        "Monitor assignment progress"
      ];
    }

    try {
      const data = typeof summary.summary_data === 'string' 
        ? JSON.parse(summary.summary_data) 
        : summary.summary_data;

      if (data.students && Array.isArray(data.students)) {
        return data.students
          .slice(0, 3)
          .map((student: any) => {
            const topRec = student.recommendations?.[0];
            if (topRec) {
              return {
                text: `${student.name}: ${topRec}`,
                studentId: student.user_id,
                emoji: student.struggles?.length > 0 ? "🎯" : "✨"
              };
            }
            return null;
          })
          .filter(Boolean);
      }
    } catch (e) {
      console.error('Failed to parse summary_data:', e);
    }

    return [
      "Review at-risk students below",
      "Schedule individual check-ins",
      "Monitor assignment progress"
    ];
  })();

  return (
    <Card className="mb-8 overflow-hidden">
      <CardHeader className="bg-gradient-primary text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            📊 Your Class at a Glance
          </CardTitle>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={handleExportPDF}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Export Summary
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Top Row - 4 Academic Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Average Assignment Grade */}
          <div className={`p-4 rounded-lg border ${
            (assignmentMetrics?.avgGrade || 0) >= 80 
              ? 'bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20' 
              : (assignmentMetrics?.avgGrade || 0) >= 60
              ? 'bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 border-yellow-500/20'
              : 'bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className={`h-4 w-4 ${
                (assignmentMetrics?.avgGrade || 0) >= 80 ? 'text-green-500' : 
                (assignmentMetrics?.avgGrade || 0) >= 60 ? 'text-yellow-500' : 
                'text-red-500'
              }`} />
              <div className="text-xs text-muted-foreground">Avg Assignment Grade</div>
            </div>
            <div className={`text-2xl font-bold ${
              (assignmentMetrics?.avgGrade || 0) >= 80 ? 'text-green-500' : 
              (assignmentMetrics?.avgGrade || 0) >= 60 ? 'text-yellow-500' : 
              'text-red-500'
            }`}>
              {assignmentMetrics?.avgGrade || 0}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {assignmentMetrics?.totalSubmissions || 0} graded submissions
            </div>
          </div>

          {/* Pending Grading */}
          <div className={`p-4 rounded-lg border ${
            (assignmentMetrics?.pendingGradingCount || 0) > 5
              ? 'bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20'
              : (assignmentMetrics?.pendingGradingCount || 0) > 0
              ? 'bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 border-yellow-500/20'
              : 'bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardCheck className={`h-4 w-4 ${
                (assignmentMetrics?.pendingGradingCount || 0) > 5 ? 'text-red-500' :
                (assignmentMetrics?.pendingGradingCount || 0) > 0 ? 'text-yellow-500' :
                'text-green-500'
              }`} />
              <div className="text-xs text-muted-foreground">Pending Grading</div>
            </div>
            <div className={`text-2xl font-bold ${
              (assignmentMetrics?.pendingGradingCount || 0) > 5 ? 'text-red-500' :
              (assignmentMetrics?.pendingGradingCount || 0) > 0 ? 'text-yellow-500' :
              'text-green-500'
            }`}>
              {assignmentMetrics?.pendingGradingCount || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              submissions awaiting review
            </div>
          </div>

          {/* Assignment Completion Rate */}
          <div className={`p-4 rounded-lg border ${
            (assignmentMetrics?.completionRate || 0) >= 80
              ? 'bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20'
              : (assignmentMetrics?.completionRate || 0) >= 60
              ? 'bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 border-yellow-500/20'
              : 'bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className={`h-4 w-4 ${
                (assignmentMetrics?.completionRate || 0) >= 80 ? 'text-green-500' :
                (assignmentMetrics?.completionRate || 0) >= 60 ? 'text-yellow-500' :
                'text-red-500'
              }`} />
              <div className="text-xs text-muted-foreground">Completion Rate</div>
            </div>
            <div className={`text-2xl font-bold ${
              (assignmentMetrics?.completionRate || 0) >= 80 ? 'text-green-500' :
              (assignmentMetrics?.completionRate || 0) >= 60 ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {assignmentMetrics?.completionRate || 0}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              of expected submissions
            </div>
          </div>

          {/* Total Assignments */}
          <div className="p-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-blue-500" />
              <div className="text-xs text-muted-foreground">Total Assignments</div>
            </div>
            <div className="text-2xl font-bold text-blue-500">
              {assignmentMetrics?.totalAssignments || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {assignmentMetrics?.overdueAssignments || 0} overdue
            </div>
          </div>
        </div>

        {/* Bottom Row - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* At-Risk Students */}
          <div className="p-4 bg-gradient-to-br from-red-500/5 to-red-500/10 rounded-lg border border-red-500/20">
            <div className="text-sm font-medium text-muted-foreground mb-3">
              Top At-Risk Students
            </div>
            <div className="space-y-2">
              {urgentStudents.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No students at risk 🎉
                </div>
              ) : (
                urgentStudents.slice(0, 5).map((student) => (
                  <div 
                    key={student.studentId} 
                    className="flex items-center gap-2 cursor-pointer hover:bg-red-500/10 p-1.5 rounded transition-colors"
                    onClick={() => navigate(`/teacher/student/${student.studentId}`)}
                  >
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm flex-1">{student.studentName}</span>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(student.riskScore)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="p-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="text-sm font-medium text-muted-foreground mb-3">
              Recommended Next Actions
            </div>
            <div className="space-y-2">
              {recommendations.slice(0, 3).map((rec, idx) => {
                const isAiRec = typeof rec === 'object';
                return (
                  <div 
                    key={idx} 
                    className={`flex items-start gap-2 ${isAiRec ? 'cursor-pointer hover:bg-blue-500/10 p-1.5 rounded transition-colors' : ''}`}
                    onClick={() => isAiRec && rec.studentId && navigate(`/teacher/student/${rec.studentId}`)}
                  >
                    <span className="text-sm mt-0.5">{isAiRec ? rec.emoji : `${idx + 1}.`}</span>
                    <span className="text-sm flex-1">{isAiRec ? rec.text : rec}</span>
                  </div>
                );
              })}
              {!summary && classroomId && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => generateSummary(classroomId)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Generate AI Recommendations'
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* AURA Performance Summary */}
          <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
            <div className="text-sm font-medium text-muted-foreground mb-3">
              AURA Performance
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">WPM Improvement</span>
                </div>
                <div className="text-xl font-bold text-primary">
                  {metrics?.wpmImprovement > 0 ? '+' : ''}{metrics?.wpmImprovement || 0}%
                </div>
              </div>
              <div className="pt-2 border-t border-primary/10">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Current: {metrics?.recentAvgWpm || 0} WPM</div>
                  <div>Sessions: {metrics?.totalSessions || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Chart - Full Width */}
        <div className="mt-6">
          <div className="p-4 bg-gradient-to-br from-purple-500/5 to-purple-500/10 rounded-lg border border-purple-500/20">
            <div className="text-sm font-medium text-muted-foreground mb-3">Last 7 Days Activity</div>
            {metrics?.activityData && metrics.activityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={metrics.activityData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                    name="AURA Sessions"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[150px] flex items-center justify-center text-sm text-muted-foreground">
                No activity data yet
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-2">
              {metrics?.totalSessions || 0} total AURA sessions
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};