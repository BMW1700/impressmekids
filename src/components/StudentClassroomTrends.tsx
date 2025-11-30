import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentClassroomTrends } from "@/hooks/useStudentClassroomTrends";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Flame, Calendar } from "lucide-react";
import { format, parseISO, subDays, eachDayOfInterval, startOfDay, isSameDay } from "date-fns";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
interface StudentClassroomTrendsProps {
  classroomId: string;
  studentId: string;
}
export const StudentClassroomTrends = ({
  classroomId,
  studentId
}: StudentClassroomTrendsProps) => {
  const {
    data,
    isLoading
  } = useStudentClassroomTrends(classroomId, studentId);
  if (isLoading) {
    return <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>)}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>;
  }
  if (!data || data.trendData.length === 0) {
    return <div className="flex flex-col items-center justify-center py-12 text-center">
        <Activity className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
        <p className="text-muted-foreground max-w-md">
          Complete assignments or practice with AURA to start tracking your progress in this classroom.
        </p>
      </div>;
  }
  const {
    trendData,
    summary
  } = data;

  // Format data for the chart
  const chartData = trendData.map(point => ({
    date: format(parseISO(point.date), 'MMM d'),
    fullDate: point.date,
    Overall: Math.round(point.overallGrade * 10) / 10,
    AURA: point.auraScore ? Math.round(point.auraScore * 10) / 10 : null,
    'Class Average': point.classAverage ? Math.round(point.classAverage * 10) / 10 : null
  }));

  // Generate calendar heat map data (last 90 days)
  const today = new Date();
  const startDate = subDays(today, 89);
  const allDays = eachDayOfInterval({
    start: startDate,
    end: today
  });
  const activityMap = new Map<string, number>();
  trendData.forEach(point => {
    const dateKey = format(parseISO(point.date), 'yyyy-MM-dd');
    activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 1);
  });
  const heatMapData = allDays.map(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return {
      date: day,
      dateKey,
      count: activityMap.get(dateKey) || 0
    };
  });
  const maxActivity = Math.max(...heatMapData.map(d => d.count), 1);
  const getActivityColor = (count: number) => {
    if (count === 0) return 'bg-muted/30';
    const intensity = count / maxActivity;
    if (intensity < 0.25) return 'bg-primary/20';
    if (intensity < 0.5) return 'bg-primary/40';
    if (intensity < 0.75) return 'bg-primary/60';
    return 'bg-primary';
  };

  // Group by weeks for display
  const weeks: Array<Array<{
    date: Date;
    dateKey: string;
    count: number;
  }>> = [];
  let currentWeek: Array<{
    date: Date;
    dateKey: string;
    count: number;
  }> = [];
  heatMapData.forEach((day, index) => {
    currentWeek.push(day);
    if ((index + 1) % 7 === 0 || index === heatMapData.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });
  return <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgLast30}%</div>
            <p className="text-xs text-muted-foreground mt-1">Average grade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {summary.improvement >= 0 ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
              Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.improvement >= 0 ? 'text-success' : 'text-destructive'}`}>
              {summary.improvement > 0 ? '+' : ''}{summary.improvement}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">vs previous period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalActivities}</div>
            <p className="text-xs text-muted-foreground mt-1">Total completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.currentStreak}</div>
            <p className="text-xs text-muted-foreground mt-1">Days in a row</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Heat Map */}
      <Card>
        <CardHeader className="text-primary">
          <CardTitle>Activity Frequency</CardTitle>
          <CardDescription>Your daily activity in this classroom over the last 90 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="flex gap-1 overflow-x-auto pb-2">
              <TooltipProvider>
                {weeks.map((week, weekIndex) => <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((day, dayIndex) => <UITooltip key={dayIndex}>
                        <TooltipTrigger asChild>
                          <div className={`w-3 h-3 rounded-sm transition-colors ${getActivityColor(day.count)}`} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <div className="font-semibold">{format(day.date, 'MMM d, yyyy')}</div>
                            <div className="text-muted-foreground">
                              {day.count === 0 ? 'No activity' : `${day.count} ${day.count === 1 ? 'activity' : 'activities'}`}
                            </div>
                          </div>
                        </TooltipContent>
                      </UITooltip>)}
                  </div>)}
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-muted/30" />
                <div className="w-3 h-3 rounded-sm bg-primary/20" />
                <div className="w-3 h-3 rounded-sm bg-primary/40" />
                <div className="w-3 h-3 rounded-sm bg-primary/60" />
                <div className="w-3 h-3 rounded-sm bg-primary" />
              </div>
              <span>More</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>Your grades over time in this classroom</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5
          }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" tick={{
              fill: 'hsl(var(--muted-foreground))'
            }} />
              <YAxis domain={[0, 100]} className="text-xs" tick={{
              fill: 'hsl(var(--muted-foreground))'
            }} label={{
              value: 'Grade (%)',
              angle: -90,
              position: 'insideLeft'
            }} />
              <Tooltip contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }} labelStyle={{
              color: 'hsl(var(--foreground))'
            }} />
              <Legend />
              <Line type="monotone" dataKey="Overall" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} activeDot={{
              r: 6
            }} />
              <Line type="monotone" dataKey="AURA" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} activeDot={{
              r: 6
            }} connectNulls />
              <Line type="monotone" dataKey="Class Average" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{
              r: 6
            }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>;
};