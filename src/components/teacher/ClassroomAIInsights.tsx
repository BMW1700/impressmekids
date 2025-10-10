import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, TrendingUp, AlertTriangle, BookOpen } from "lucide-react";
import { useTeacherSummary } from "@/hooks/useTeacherSummary";
import { useNavigate } from "react-router-dom";

interface ClassroomAIInsightsProps {
  classroomId: string;
}

export const ClassroomAIInsights = ({ classroomId }: ClassroomAIInsightsProps) => {
  const { summary, isLoading, generateSummary, isGenerating } = useTeacherSummary(classroomId);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>
            Generate comprehensive AI analysis of student progress, strengths, and areas for improvement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => generateSummary(classroomId)}
            disabled={isGenerating}
            size="lg"
          >
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate AI Summary
          </Button>
        </CardContent>
      </Card>
    );
  }

  const summaryData = summary.summary_data as {
    class_summary: {
      top_performers: string[];
      students_at_risk: string[];
      subject_trends: Record<string, { average_score: number; students_struggling: string[] }>;
      general_notes: string;
    };
    students: Array<{
      profile_id: string;
      name: string;
      strengths: string[];
      struggles: string[];
      completion_summary: string;
      aura_summary: {
        clarity: number;
        pace: number;
        confidence: number;
        feedback: string[];
      };
      actionable_recommendations: string[];
    }>;
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Insights</h2>
          <p className="text-sm text-muted-foreground">
            Generated {new Date(summary.generated_at).toLocaleDateString()} • 
            {summary.students_count} students analyzed
          </p>
        </div>
        <Button 
          onClick={() => generateSummary(classroomId)}
          disabled={isGenerating}
          variant="outline"
        >
          {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Refresh Insights
        </Button>
      </div>

      {/* Class Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Class Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Top Performers */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summaryData.class_summary.top_performers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {summaryData.class_summary.top_performers.map((name) => (
                      <Badge key={name} variant="secondary" className="bg-green-100 text-green-800">
                        {name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                )}
              </CardContent>
            </Card>

            {/* At Risk */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Students At Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summaryData.class_summary.students_at_risk.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {summaryData.class_summary.students_at_risk.map((name) => (
                      <Badge key={name} variant="secondary" className="bg-orange-100 text-orange-800">
                        {name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">All students on track</p>
                )}
              </CardContent>
            </Card>

            {/* Subject Trends */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Subject Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {Object.entries(summaryData.class_summary.subject_trends || {}).map(([subject, data]) => (
                    <div key={subject} className="flex justify-between">
                      <span>{subject}</span>
                      <span className="font-medium">{data.average_score}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* General Notes */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <p className="text-sm">{summaryData.class_summary.general_notes}</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Individual Student Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {summaryData.students.map((student) => (
          <Card key={student.profile_id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {student.name}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/teacher/student/${student.profile_id}`)}
                >
                  View Profile →
                </Button>
              </CardTitle>
              <CardDescription>{student.completion_summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Strengths */}
              {student.strengths.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 text-green-700">Strengths</p>
                  <div className="flex flex-wrap gap-2">
                    {student.strengths.map((strength, i) => (
                      <Badge key={i} variant="secondary" className="bg-green-50">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Struggles */}
              {student.struggles.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 text-orange-700">Areas for Improvement</p>
                  <div className="flex flex-wrap gap-2">
                    {student.struggles.map((struggle, i) => (
                      <Badge key={i} variant="secondary" className="bg-orange-50">
                        {struggle}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* AURA Summary */}
              {student.aura_summary && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Speaking Analysis (AURA)</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex flex-col items-center p-2 bg-muted rounded">
                      <span className="text-xs text-muted-foreground">Clarity</span>
                      <span className="font-bold">{student.aura_summary.clarity}/5</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-muted rounded">
                      <span className="text-xs text-muted-foreground">Pace</span>
                      <span className="font-bold">{student.aura_summary.pace}/5</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-muted rounded">
                      <span className="text-xs text-muted-foreground">Confidence</span>
                      <span className="font-bold">{student.aura_summary.confidence}/5</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {student.actionable_recommendations.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">💡 Recommendations</p>
                  <ul className="text-sm space-y-1">
                    {student.actionable_recommendations.map((rec, i) => (
                      <li key={i} className="text-muted-foreground">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
