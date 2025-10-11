import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClassroomMetrics } from "@/hooks/useClassroomMetrics";
import { usePriorityStudents } from "@/hooks/usePriorityStudents";
import { useTeacherSummary } from "@/hooks/useTeacherSummary";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TeacherSuccessBoardProps {
  classroomId?: string;
}

export const TeacherSuccessBoard = ({ classroomId }: TeacherSuccessBoardProps) => {
  const { metrics, isLoading: metricsLoading } = useClassroomMetrics();
  const { urgentStudents, isLoading: studentsLoading } = usePriorityStudents();
  const { summary, generateSummary, isGenerating } = useTeacherSummary(classroomId);
  const navigate = useNavigate();

  const isLoading = metricsLoading || studentsLoading;

  const handleExportPDF = () => {
    // For now, just generate the summary - PDF export would require additional library
    if (!summary && classroomId) {
      generateSummary(classroomId);
    } else {
      // Simple CSV export for now
      const csvContent = [
        ['Metric', 'Value'],
        ['WPM Improvement', `${metrics?.wpmImprovement || 0}%`],
        ['Current Avg WPM', `${metrics?.recentAvgWpm || 0}`],
        ['Previous Avg WPM', `${metrics?.olderAvgWpm || 0}`],
        ['Total Sessions (30 days)', `${metrics?.totalSessions || 0}`],
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

  const summaryText = summary?.summary_data 
    ? typeof summary.summary_data === 'string' 
      ? summary.summary_data 
      : JSON.stringify(summary.summary_data)
    : null;

  const recommendations = summaryText
    ? [summaryText.split('.')[0] + '.'] 
    : [
        "Review at-risk students below",
        "Schedule individual check-ins",
        "Monitor pronunciation progress"
      ];

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
        <div className="grid md:grid-cols-4 gap-6">
          {/* WPM Improvement */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              WPM Improvement (30 days)
            </div>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold">
                {metrics?.wpmImprovement !== undefined ? (
                  <>
                    {metrics.wpmImprovement > 0 ? '+' : ''}{metrics.wpmImprovement}%
                  </>
                ) : '---'}
              </div>
              {metrics?.wpmImprovement !== undefined && (
                <>
                  {metrics.wpmImprovement > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                </>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {metrics?.olderAvgWpm || 0} → {metrics?.recentAvgWpm || 0} WPM
            </div>
          </div>

          {/* At-Risk Students */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
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
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded"
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
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Recommended Next Actions
            </div>
            <div className="space-y-2">
              {recommendations.slice(0, 3).map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary mt-0.5">
                    {idx + 1}
                  </div>
                  <span className="text-sm">{rec}</span>
                </div>
              ))}
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

          {/* Activity Chart */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Class Activity (7 days)
            </div>
            {metrics?.activityData && metrics.activityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={metrics.activityData}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    width={25}
                  />
                  <Tooltip 
                    contentStyle={{ fontSize: 12 }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[120px] flex items-center justify-center text-sm text-muted-foreground">
                No activity data yet
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              {metrics?.totalSessions || 0} total sessions
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
