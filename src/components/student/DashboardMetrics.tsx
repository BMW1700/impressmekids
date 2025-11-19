import { Card, CardContent } from "@/components/ui/card";
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
    "blue-600": "border-blue-600/20 bg-blue-600/10 text-blue-600 dark:text-blue-400",
    "green-600": "border-green-600/20 bg-green-600/10 text-green-600 dark:text-green-400",
    "yellow-600": "border-yellow-600/20 bg-yellow-600/10 text-yellow-600 dark:text-yellow-400",
    "purple-600": "border-purple-600/20 bg-purple-600/10 text-purple-600 dark:text-purple-400",
    "orange-600": "border-orange-600/20 bg-orange-600/10 text-orange-600 dark:text-orange-400",
    "pink-600": "border-pink-600/20 bg-pink-600/10 text-pink-600 dark:text-pink-400",
  }[color] || "";

  const [borderClass, bgClass, textClass] = colorClasses.split(" ");

  return (
    <Card className={`${borderClass} hover:shadow-lg transition-all duration-300 hover:scale-105`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${bgClass}`}>
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
        <div className="text-sm text-muted-foreground">{title}</div>
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <MetricCard
        title="Assignments"
        value={totalAssignments}
        icon={<BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
        trend={{ value: 12, direction: "up" }}
        color="blue-600"
      />
      <MetricCard
        title="Completion Rate"
        value={`${completionRate}%`}
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
        title="AURA Minutes"
        value="24"
        icon={<Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />}
        trend={{ value: 15, direction: "up" }}
        color="purple-600"
      />
      <MetricCard
        title="Achievements"
        value={studentStats?.games_won || 0}
        icon={<Trophy className="h-6 w-6 text-orange-600 dark:text-orange-400" />}
        color="orange-600"
      />
      <MetricCard
        title="Games Played"
        value={studentStats?.games_played || 0}
        icon={<Award className="h-6 w-6 text-pink-600 dark:text-pink-400" />}
        trend={{ value: 8, direction: "up" }}
        color="pink-600"
      />
    </div>
  );
};
