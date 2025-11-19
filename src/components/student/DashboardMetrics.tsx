import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Trophy,
  Award,
  Zap,
} from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  color: string;
}

const MetricCard = ({ title, value, icon, trend, color }: MetricCardProps) => {
  const colorClasses = {
    "blue-600": "border-blue-600/20 bg-blue-600/10 text-blue-600 dark:text-blue-400 progress-blue",
    "green-600": "border-green-600/20 bg-green-600/10 text-green-600 dark:text-green-400 progress-green",
    "yellow-600": "border-yellow-600/20 bg-yellow-600/10 text-yellow-600 dark:text-yellow-400 progress-yellow",
    "purple-600": "border-purple-600/20 bg-purple-600/10 text-purple-600 dark:text-purple-400 progress-purple",
    "orange-600": "border-orange-600/20 bg-orange-600/10 text-orange-600 dark:text-orange-400 progress-orange",
    "pink-600": "border-pink-600/20 bg-pink-600/10 text-pink-600 dark:text-pink-400 progress-pink",
  }[color] || "";

  const [borderClass, bgClass, textClass, progressClass] = colorClasses.split(" ");
  
  // Extract progress value if it exists in the value string
  const progressMatch = typeof value === 'string' && value.includes('%') ? parseInt(value) : null;

  return (
    <Card className={`${borderClass} hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${bgClass} group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                trend.direction === "up"
                  ? "text-green-600 dark:text-green-400"
                  : trend.direction === "down"
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground"
              }`}
            >
              {trend.direction === "up" ? (
                <TrendingUp className="h-4 w-4" />
              ) : trend.direction === "down" ? (
                <TrendingDown className="h-4 w-4" />
              ) : null}
              {trend.value > 0 && "+"}
              {trend.value}%
            </div>
          )}
        </div>
        <div className={`text-3xl font-bold ${textClass} mb-1`}>{value}</div>
        <div className="text-sm text-muted-foreground mb-3">{title}</div>
        {progressMatch !== null && (
          <Progress value={progressMatch} className={`h-2 ${progressClass}`} />
        )}
      </CardContent>
    </Card>
  );
};

interface DashboardMetricsProps {
  assignmentStats: any;
  studentStats: any;
}

export const DashboardMetrics = ({
  assignmentStats,
  studentStats,
}: DashboardMetricsProps) => {
  const totalAssignments = assignmentStats?.total_assignments || 0;
  const completedAssignments = assignmentStats?.completed_assignments || 0;
  const completionRate = totalAssignments > 0 
    ? Math.round((completedAssignments / totalAssignments) * 100) 
    : 0;
  
  const gamesPlayed = studentStats?.games_played || 0;
  const gamesWon = studentStats?.games_won || 0;
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Assignment Progress"
          value={`${completionRate}%`}
          icon={<BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
          trend={{ value: 12, direction: "up" }}
          color="blue-600"
        />
        <MetricCard
          title="Completion Rate"
          value={`${completedAssignments}/${totalAssignments}`}
          icon={<CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />}
          trend={{ value: 5, direction: "up" }}
          color="green-600"
        />
        <MetricCard
          title="Current Streak"
          value="5 days"
          icon={<Zap className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />}
          trend={{ value: 2, direction: "up" }}
          color="yellow-600"
        />
        <MetricCard
          title="AURA Practice"
          value="24 min"
          icon={<Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />}
          trend={{ value: 15, direction: "up" }}
          color="purple-600"
        />
        <MetricCard
          title="Game Win Rate"
          value={`${winRate}%`}
          icon={<Trophy className="h-6 w-6 text-orange-600 dark:text-orange-400" />}
          trend={{ value: 8, direction: "up" }}
          color="orange-600"
        />
        <MetricCard
          title="Total Games"
          value={gamesPlayed}
          icon={<Award className="h-6 w-6 text-pink-600 dark:text-pink-400" />}
          color="pink-600"
        />
      </div>
    </div>
  );
};
