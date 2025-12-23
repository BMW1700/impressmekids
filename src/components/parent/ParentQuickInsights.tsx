import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  Award,
  ArrowUp,
  ArrowDown,
  Sparkles
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

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Fetch all data in PARALLEL instead of sequential
      const [auraResult, behaviorResult, scoresResult] = await Promise.all([
        supabase
          .from("aura_records")
          .select("wpm, clarity, confidence, created_at")
          .eq("profile_id", studentId)
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("created_at", { ascending: true }),
        supabase
          .from("student_behavior_stats")
          .select("total_points, weekly_points, current_streak")
          .eq("student_id", studentId),
        supabase
          .from("student_standard_scores")
          .select(`
            mastery_percentage,
            learning_standards (
              subject
            )
          `)
          .eq("student_id", studentId)
          .order("mastery_percentage", { ascending: false })
          .limit(30)
      ]);

      const auraRecords = auraResult.data;
      const behaviorStats = behaviorResult.data;
      const standardScores = scoresResult.data;

      // Process AURA data
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

      // Process behavior data
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

      // Process standard scores
      if (standardScores && standardScores.length > 0) {
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
    staleTime: 5 * 60 * 1000, // 5 minute cache
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "strength":
        return <Award className="h-5 w-5 text-white" />;
      case "improvement":
        return <Target className="h-5 w-5 text-white" />;
      case "achievement":
        return <TrendingUp className="h-5 w-5 text-white" />;
      case "tip":
        return <Lightbulb className="h-5 w-5 text-white" />;
      default:
        return <Brain className="h-5 w-5 text-white" />;
    }
  };

  const getInsightIconClass = (type: string) => {
    switch (type) {
      case "strength":
        return "icon-circle icon-circle-green";
      case "improvement":
        return "icon-circle icon-circle-orange";
      case "achievement":
        return "icon-circle icon-circle-blue";
      case "tip":
        return "icon-circle icon-circle-gold";
      default:
        return "icon-circle icon-circle-purple";
    }
  };

  const getInsightBg = (type: string) => {
    switch (type) {
      case "strength":
        return "bg-gradient-to-r from-green-500/5 to-green-500/10 border-green-500/20";
      case "improvement":
        return "bg-gradient-to-r from-orange-500/5 to-orange-500/10 border-orange-500/20";
      case "achievement":
        return "bg-gradient-to-r from-blue-500/5 to-blue-500/10 border-blue-500/20";
      case "tip":
        return "bg-gradient-to-r from-yellow-500/5 to-yellow-500/10 border-yellow-500/20";
      default:
        return "bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20";
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
      <Card variant="glass" className="border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="icon-circle icon-circle-sm icon-circle-purple">
              <Brain className="h-4 w-4 text-white" />
            </div>
            Quick Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="skeleton-shimmer p-4 rounded-xl h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="border-0 bg-gradient-to-br from-primary/[0.04] to-secondary/[0.02]">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="icon-circle icon-circle-sm icon-circle-purple">
            <Brain className="h-4 w-4 text-white" />
          </div>
          Quick Insights
          <Badge variant="gold" className="ml-auto gap-1">
            <Sparkles className="h-3 w-3" />
            AI-Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!insights || insights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="icon-circle icon-circle-lg mx-auto mb-4 bg-muted">
              <Brain className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm">Insights will appear as more data is collected</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {insights.map((insight, index) => (
              <div 
                key={index}
                className={`p-4 rounded-xl border backdrop-blur-sm ${getInsightBg(insight.type)} transition-all duration-300 hover:scale-[1.02] hover:shadow-md`}
              >
                <div className="flex items-start gap-4">
                  <div className={getInsightIconClass(insight.type)}>
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{insight.title}</h4>
                      {insight.trend && getTrendIcon(insight.trend)}
                      {insight.metric !== undefined && (
                        <Badge variant="secondary" className="ml-auto font-bold">
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
