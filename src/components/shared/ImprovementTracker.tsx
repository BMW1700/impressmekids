import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend
} from "recharts";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

interface ImprovementTrackerProps {
  studentId: string;
  studentName: string;
  variant?: "simple" | "detailed";
}

export const ImprovementTracker = ({ 
  studentId, 
  studentName, 
  variant = "simple" 
}: ImprovementTrackerProps) => {
  const { data: progress, isLoading } = useWeeklyProgress(studentId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!progress || progress.weeklyTrend.length === 0) {
    return (
      <Card className="border-0 bg-muted/30">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <BarChart3 className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-sm">
            Progress tracking will appear after a few reading sessions
          </p>
        </CardContent>
      </Card>
    );
  }

  const { weeklyTrend, wcpmChange, accuracyChange, isImproving } = progress;

  // Prepare chart data
  const chartData = weeklyTrend.map((week) => ({
    week: format(parseISO(week.weekStart), "MMM d"),
    wcpm: week.avgWcpm,
    accuracy: week.avgAccuracy,
    fluency: week.avgFluency,
    sessions: week.sessionsCount,
  }));

  // Calculate overall trend
  const firstWeek = weeklyTrend[0];
  const lastWeek = weeklyTrend[weeklyTrend.length - 1];
  const totalWcpmGrowth = lastWeek ? lastWeek.avgWcpm - firstWeek.avgWcpm : 0;
  const totalAccuracyGrowth = lastWeek ? lastWeek.avgAccuracy - firstWeek.avgAccuracy : 0;

  const TrendIcon = isImproving ? TrendingUp : wcpmChange === 0 && accuracyChange === 0 ? Minus : TrendingDown;
  const trendColor = isImproving ? "text-green-600" : wcpmChange === 0 && accuracyChange === 0 ? "text-muted-foreground" : "text-red-600";

  if (variant === "simple") {
    return (
      <Card className="border-0 bg-gradient-to-br from-primary/5 to-secondary/5 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendIcon className={`h-5 w-5 ${trendColor}`} />
              Reading Progress
            </span>
            {isImproving && (
              <Badge className="bg-green-500/20 text-green-700 border-0">
                Improving!
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="wcpmGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="wcpm" 
                  stroke="hsl(var(--primary))" 
                  fill="url(#wcpmGradient)"
                  strokeWidth={2}
                  name="Words/Min"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-3 rounded-lg bg-background/60">
              <p className="text-2xl font-bold text-primary">{lastWeek?.avgWcpm || 0}</p>
              <p className="text-xs text-muted-foreground">Current WPM</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/60">
              <p className={`text-2xl font-bold ${totalWcpmGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                {totalWcpmGrowth >= 0 ? "+" : ""}{totalWcpmGrowth}
              </p>
              <p className="text-xs text-muted-foreground">Total Growth</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Detailed variant
  return (
    <Card className="border-0 bg-gradient-to-br from-primary/5 to-secondary/5 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Week-by-Week Improvement
          </span>
          <div className="flex gap-2">
            {totalWcpmGrowth !== 0 && (
              <Badge className={totalWcpmGrowth > 0 ? "bg-green-500/20 text-green-700 border-0" : "bg-red-500/20 text-red-700 border-0"}>
                {totalWcpmGrowth > 0 ? "+" : ""}{totalWcpmGrowth} WPM
              </Badge>
            )}
            {totalAccuracyGrowth !== 0 && (
              <Badge className={totalAccuracyGrowth > 0 ? "bg-blue-500/20 text-blue-700 border-0" : "bg-red-500/20 text-red-700 border-0"}>
                {totalAccuracyGrowth > 0 ? "+" : ""}{totalAccuracyGrowth}% Accuracy
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="week" 
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="wcpm" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
                name="Words/Min"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="accuracy" 
                stroke="hsl(142, 76%, 36%)" 
                strokeWidth={2}
                dot={{ fill: "hsl(142, 76%, 36%)" }}
                name="Accuracy %"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="fluency" 
                stroke="hsl(221, 83%, 53%)" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "hsl(221, 83%, 53%)" }}
                name="Fluency %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-primary/5">
            <p className="text-2xl font-bold text-primary">{lastWeek?.avgWcpm || 0}</p>
            <p className="text-xs text-muted-foreground">Current WPM</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-500/5">
            <p className="text-2xl font-bold text-green-600">{lastWeek?.avgAccuracy || 0}%</p>
            <p className="text-xs text-muted-foreground">Accuracy</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-500/5">
            <p className="text-2xl font-bold text-blue-600">{lastWeek?.avgFluency || 0}%</p>
            <p className="text-xs text-muted-foreground">Fluency</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-purple-500/5">
            <p className="text-2xl font-bold text-purple-600">
              {weeklyTrend.reduce((sum, w) => sum + w.totalWordsRead, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Words</p>
          </div>
        </div>

        {/* Weekly Breakdown Table */}
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">Week</th>
                <th className="text-center p-3">Sessions</th>
                <th className="text-center p-3">WPM</th>
                <th className="text-center p-3">Accuracy</th>
                <th className="text-center p-3">Words Read</th>
              </tr>
            </thead>
            <tbody>
              {[...weeklyTrend].reverse().map((week, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3">
                    {format(parseISO(week.weekStart), "MMM d")}
                  </td>
                  <td className="text-center p-3">{week.sessionsCount}</td>
                  <td className="text-center p-3 font-semibold">{week.avgWcpm}</td>
                  <td className="text-center p-3">
                    <Badge variant={week.avgAccuracy >= 80 ? "default" : "secondary"}>
                      {week.avgAccuracy}%
                    </Badge>
                  </td>
                  <td className="text-center p-3">{week.totalWordsRead}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
