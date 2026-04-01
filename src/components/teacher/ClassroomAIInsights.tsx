import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, TrendingUp, AlertTriangle, BookOpen } from "lucide-react";
import { useTeacherSummary } from "@/hooks/useTeacherSummary";
import { useNavigate } from "react-router-dom";
import { ipaToEnglish } from "@/lib/phonemeDisplayUtils";

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
    class_summary?: {
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
      phoneme_analysis?: {
        struggling_sounds?: string[];
        accuracy_scores?: Record<string, number>;
        mastered_sounds?: string[];
        ready_for_transfer?: string[];
      };
      fluency_metrics?: {
        wpm?: number;
        wpm_trend?: string;
        grade_level_comparison?: string;
        pause_analysis?: string;
      };
      actionable_recommendations: string[];
    }>;
  };

  // Add fallback if class_summary is missing
  if (!summaryData.class_summary) {
    console.error('AI returned invalid structure, missing class_summary:', summaryData);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>
            The summary data is incomplete. Please regenerate the insights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => generateSummary(classroomId)}
            disabled={isGenerating}
            size="lg"
          >
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Regenerate AI Summary
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with AI Processing Indicator */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 border-2 border-primary/20 shadow-elegant">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg">
              <Sparkles className="h-8 w-8 text-white animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">AI Insights Dashboard</h2>
            <p className="text-sm text-muted-foreground mt-1">
              🧠 Generated {new Date(summary.generated_at).toLocaleDateString()} • 
              {summary.students_count} students analyzed • Powered by 4 Patented ML Models
            </p>
          </div>
        </div>
        <Button 
          onClick={() => generateSummary(classroomId)}
          disabled={isGenerating}
          size="lg"
          className="bg-gradient-primary hover:opacity-90 shadow-card w-full md:w-auto"
        >
          {isGenerating && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          <Sparkles className="mr-2 h-5 w-5" />
          Refresh Insights
        </Button>
      </div>

      {/* Enhanced Class Summary */}
      <Card className="shadow-elegant border-2 border-primary/10">
        <CardHeader className="bg-gradient-to-br from-muted/30 to-muted/10">
          <CardTitle className="text-2xl flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Class Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Top Performers - Enhanced */}
            <Card className="shadow-card hover:shadow-elegant transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-2 border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-200/50 dark:bg-green-800/50">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summaryData.class_summary.top_performers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {summaryData.class_summary.top_performers.map((name) => (
                      <Badge key={name} className="bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 text-sm">
                        🌟 {name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                )}
              </CardContent>
            </Card>

            {/* At Risk - Enhanced */}
            <Card className="shadow-card hover:shadow-elegant transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 border-2 border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-orange-200/50 dark:bg-orange-800/50">
                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  Students At Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summaryData.class_summary.students_at_risk.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {summaryData.class_summary.students_at_risk.map((name) => (
                      <Badge key={name} className="bg-orange-600 text-white hover:bg-orange-700 px-3 py-1.5 text-sm">
                        ⚠️ {name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <span className="text-2xl">✅</span>
                    <p className="text-sm font-medium">All students on track</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subject Trends - Enhanced */}
            <Card className="shadow-card hover:shadow-elegant transition-all duration-300 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  Subject Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(summaryData.class_summary.subject_trends || {}).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(summaryData.class_summary.subject_trends || {}).map(([subject, data]) => (
                      <div key={subject} className="flex justify-between items-center p-2 rounded-lg bg-background/50">
                        <span className="text-sm font-medium">{subject}</span>
                        <Badge variant="outline" className="font-bold text-base">
                          {data.average_score}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No subject data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* General Notes - Enhanced */}
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent/20 shadow-card">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="text-2xl">📊</div>
                <p className="text-base leading-relaxed">{summaryData.class_summary.general_notes}</p>
              </div>
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

              {/* Phoneme Breakdown */}
              {student.phoneme_analysis && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">🔤 Phoneme Analysis</p>
                  
                  {student.phoneme_analysis.struggling_sounds && student.phoneme_analysis.struggling_sounds.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Struggling Sounds:</p>
                      <div className="flex flex-wrap gap-1">
                        {student.phoneme_analysis.struggling_sounds.map((sound, i) => (
                          <Badge key={i} variant="destructive" className="text-xs">
                            {sound}
                            {student.phoneme_analysis?.accuracy_scores?.[sound.split(' ')[0]] && 
                              ` ${student.phoneme_analysis.accuracy_scores[sound.split(' ')[0]]}%`
                            }
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {student.phoneme_analysis.mastered_sounds && student.phoneme_analysis.mastered_sounds.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Mastered Sounds:</p>
                      <div className="flex flex-wrap gap-1">
                        {student.phoneme_analysis.mastered_sounds.map((sound, i) => (
                          <Badge key={i} variant="secondary" className="bg-green-50 text-green-700 text-xs">
                            {sound}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Fluency Metrics */}
              {student.fluency_metrics && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">📊 Fluency Trends</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {student.fluency_metrics.wpm && (
                      <div className="p-2 bg-muted rounded">
                        <span className="text-muted-foreground">WPM:</span>{' '}
                        <span className="font-semibold">{student.fluency_metrics.wpm}</span>
                        {student.fluency_metrics.wpm_trend && (
                          <span className={`ml-1 ${student.fluency_metrics.wpm_trend === 'increasing' ? 'text-green-600' : 'text-orange-600'}`}>
                            {student.fluency_metrics.wpm_trend === 'increasing' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    )}
                    {student.fluency_metrics.grade_level_comparison && (
                      <div className="p-2 bg-muted rounded">
                        <span className="text-muted-foreground">Grade Level:</span>{' '}
                        <span className="font-semibold text-xs">{student.fluency_metrics.grade_level_comparison}</span>
                      </div>
                    )}
                  </div>
                  {student.fluency_metrics.pause_analysis && (
                    <p className="text-xs text-muted-foreground italic">{student.fluency_metrics.pause_analysis}</p>
                  )}
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
