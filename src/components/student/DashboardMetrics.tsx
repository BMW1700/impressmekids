import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CheckCircle,
  TrendingUp,
  Target,
  Trophy,
  Zap,
  Gamepad2,
  ArrowUp,
} from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconClass: string;
  trend?: { value: string; positive: boolean };
  progress?: number;
  progressGradient?: "purple" | "blue" | "green" | "gold" | "orange" | "multi";
}

const MetricCard = ({ title, value, icon, iconClass, trend, progress, progressGradient = "purple" }: MetricCardProps) => {
  return (
    <Card variant="glass" className="hover-lift relative overflow-hidden">
      {/* Top colored border */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
        iconClass.includes('blue') ? 'from-blue-500 to-blue-400' :
        iconClass.includes('green') ? 'from-green-500 to-green-400' :
        iconClass.includes('purple') ? 'from-purple-500 to-purple-400' :
        iconClass.includes('gold') ? 'from-amber-500 to-amber-400' :
        iconClass.includes('orange') ? 'from-orange-500 to-orange-400' :
        'from-purple-500 to-pink-400'
      }`} />
      
      <CardContent className="p-5 pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className={iconClass}>
            {icon}
          </div>
          {trend && (
            <Badge 
              variant={trend.positive ? "green" : "red"} 
              className="text-xs flex items-center gap-1"
            >
              <ArrowUp className={`h-3 w-3 ${!trend.positive ? 'rotate-180' : ''}`} />
              {trend.value}
            </Badge>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-4xl font-black text-foreground">{value}</p>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
        </div>
        
        {progress !== undefined && (
          <div className="mt-4">
            <Progress value={progress} variant="premium" gradient={progressGradient} className="h-2" />
          </div>
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
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard
        title="Assignment Progress"
        value={`${completionRate}%`}
        icon={<TrendingUp className="h-5 w-5 text-white" />}
        iconClass="icon-circle-blue"
        trend={{ value: "+12%", positive: true }}
        progress={completionRate}
        progressGradient="blue"
      />
      
      <MetricCard
        title="Completion Rate"
        value={`${completedAssignments}/${totalAssignments}`}
        icon={<Target className="h-5 w-5 text-white" />}
        iconClass="icon-circle-green"
        progress={(completedAssignments / Math.max(totalAssignments, 1)) * 100}
        progressGradient="green"
      />
      
      <MetricCard
        title="Current Streak"
        value="5 days"
        icon={<Zap className="h-5 w-5 text-white" />}
        iconClass="icon-circle-orange"
        trend={{ value: "+2", positive: true }}
      />
      
      <MetricCard
        title="AURA Practice"
        value="24 min"
        icon={<BookOpen className="h-5 w-5 text-white" />}
        iconClass="icon-circle-purple"
        progress={60}
        progressGradient="purple"
      />
      
      <MetricCard
        title="Game Win Rate"
        value={`${winRate}%`}
        icon={<Trophy className="h-5 w-5 text-white" />}
        iconClass="icon-circle-gold"
        progress={winRate}
        progressGradient="gold"
      />
      
      <MetricCard
        title="Games Played"
        value={gamesPlayed}
        icon={<Gamepad2 className="h-5 w-5 text-white" />}
        iconClass="icon-circle-purple"
      />
    </div>
  );
};
