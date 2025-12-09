import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  Award,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";

interface ParentQuickInsightsProps {
  studentId: string;
  studentName: string;
}

export const ParentQuickInsights = ({ studentId, studentName }: ParentQuickInsightsProps) => {
  const { data: insights, isLoading } = useQuery({
    queryKey: ["parent-quick-insights", studentId],
    queryFn: async () => {
      const insights: {
        type: "strength" | "improvement" | "achievement" | "tip";
        title: string;
        description: string;
        metric?: number;
        trend?: "up" | "down" | "stable";
      }[] = [];

      // Get AURA data for reading insights
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: auraRecords } = await supabase
        .from("aura_records")
        .select("wpm, clarity, confidence, created_at")
        .eq("profile_id", studentId)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (auraRecords && auraRecords.length >= 3) {
        const recentRecords = auraRecords.slice(-5);
        const olderRecords = auraRecords.slice(0, Math.min(5, auraRecords.length - 5));
        
        if (olderRecords.length > 0) {
          const recentAvgWpm = recentRecords.reduce((s, r) => s + r.wpm, 0) / recentRecords.length;
          const olderAvgWpm = olderRecords.reduce((s, r) => s + r.wpm, 0) / olderRecords.length;
          const wpmChange = recentAvgWpm - olderAvgWpm;

          if (wpmChange > 5) {
            insights.push({
              type: "achievement",
              title: "Reading Speed Improving",
              description: `${studentName.split(" ")[0]}'s reading speed has increased by ${Math.round(wpmChange)} WPM this month!`,
              metric: Math.round(recentAvgWpm),
              trend: "up",
            });
          }

          const recentAvgClarity = recentRecords.reduce((s, r) => s + r.clarity, 0) / recentRecords.length;
          if (recentAvgClarity >= 85) {
            insights.push({
              type: "strength",
              title: "Excellent Pronunciation",
              description: `Reading clarity is at ${Math.round(recentAvgClarity)}% - keep up the great work!`,
              metric: Math.round(recentAvgClarity),
            });
          } else if (recentAvgClarity < 70) {
            insights.push({
              type: "improvement",
              title: "Pronunciation Practice",
              description: "Consider practicing reading aloud together to improve clarity.",
              metric: Math.round(recentAvgClarity),
            });
          }
        }
      }

      // Get behavior trends
      const { data: behaviorStats } = await supabase
        .from("student_behavior_stats")
        .select("*")
        .eq("student_id", studentId);

      if (behaviorStats && behaviorStats.length > 0) {
        const totalWeekly = behaviorStats.reduce((s, b) => s + (b.weekly_points || 0), 0);
        const bestStreak = Math.max(...behaviorStats.map((b) => b.current_streak || 0));

        if (bestStreak >= 5) {
          insights.push({
            type: "achievement",
            title: `${bestStreak} Day Positive Streak!`,
            description: "Consistent positive behavior in class - celebrate this milestone!",
            metric: bestStreak,
          });
        }

        if (totalWeekly >= 10) {
          insights.push({
            type: "strength",
            title: "Great Week in Class",
            description: `Earned ${totalWeekly} behavior points this week!`,
            metric: totalWeekly,
            trend: "up",
          });
        }
      }

      // Get standard scores for academic insights
      const { data: standardScores } = await supabase
        .from("student_standard_scores")
        .select(`
          mastery_percentage,
          assignments_completed,
          learning_standards (
            code,
            description,
            subject
          )
        `)
        .eq("student_id", studentId)
        .order("mastery_percentage", { ascending: false });

      if (standardScores && standardScores.length > 0) {
        // Find strongest subject
        const subjectMastery: Record<string, { total: number; count: number }> = {};
        standardScores.forEach((score: any) => {
          const subject = score.learning_standards?.subject || "General";
          if (!subjectMastery[subject]) {
            subjectMastery[subject] = { total: 0, count: 0 };
          }
          subjectMastery[subject].total += score.mastery_percentage;
          subjectMastery[subject].count++;
        });

        let strongest = { subject: "", avg: 0 };
        let weakest = { subject: "", avg: 100 };

        Object.entries(subjectMastery).forEach(([subject, data]) => {
          const avg = data.total / data.count;
          if (avg > strongest.avg) {
            strongest = { subject, avg };
          }
          if (avg < weakest.avg && data.count >= 2) {
            weakest = { subject, avg };
          }
        });

        if (strongest.avg >= 80) {
          insights.push({
            type: "strength",
            title: `Strong in ${strongest.subject}`,
            description: `Averaging ${Math.round(strongest.avg)}% mastery - a real strength!`,
            metric: Math.round(strongest.avg),
          });
        }

        if (weakest.avg < 70 && weakest.subject !== strongest.subject) {
          insights.push({
            type: "improvement",
            title: `Focus on ${weakest.subject}`,
            description: "Extra practice here could make a big difference.",
            metric: Math.round(weakest.avg),
          });
        }
      }

      // Add general tips if we have few insights
      if (insights.length < 3) {
        insights.push({
          type: "tip",
          title: "Daily Reading Time",
          description: "15-20 minutes of reading together each day builds strong skills.",
        });
      }

      return insights.slice(0, 4);
    },
    enabled: !!studentId,
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "strength":
        return <Award className="h-5 w-5 text-green-600" />;
      case "improvement":
        return <Target className="h-5 w-5 text-orange-600" />;
      case "achievement":
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case "tip":
        return <Lightbulb className="h-5 w-5 text-yellow-600" />;
      default:
        return <Brain className="h-5 w-5 text-primary" />;
    }
  };

  const getInsightBg = (type: string) => {
    switch (type) {
      case "strength":
        return "bg-green-500/5 border-green-500/20";
      case "improvement":
        return "bg-orange-500/5 border-orange-500/20";
      case "achievement":
        return "bg-blue-500/5 border-blue-500/20";
      case "tip":
        return "bg-yellow-500/5 border-yellow-500/20";
      default:
        return "bg-primary/5 border-primary/20";
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "up":
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 bg-gradient-to-br from-primary/5 to-secondary/5 shadow-[var(--shadow-glass-md)] backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5" />
            Quick Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse p-4 rounded-lg bg-muted/30">
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-gradient-to-br from-primary/5 to-secondary/5 shadow-[var(--shadow-glass-md)] backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5" />
          Quick Insights
          <Badge variant="secondary" className="ml-auto text-xs">
            AI-Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!insights || insights.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Insights will appear as more data is collected</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {insights.map((insight, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${getInsightBg(insight.type)} transition-all hover:scale-[1.01]`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center shadow-sm">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{insight.title}</h4>
                      {insight.trend && getTrendIcon(insight.trend)}
                      {insight.metric !== undefined && (
                        <Badge variant="secondary" className="text-xs ml-auto">
                          {insight.metric}{insight.type === "strength" || insight.type === "improvement" ? "%" : ""}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
