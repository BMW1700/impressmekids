import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, parseISO } from "date-fns";
import { 
  getFluencyNorm, 
  getCurrentScreeningPeriod,
  getExpectedWeeklyGrowth,
  type BenchmarkStatus 
} from "@/lib/fluencyBenchmarks";
import { BenchmarkStatusBadge } from "./BenchmarkStatusBadge";
import { TrendingUp, TrendingDown, Minus, Target } from "lucide-react";

interface DataPoint {
  date: string;
  wcpm: number;
  accuracy?: number;
  benchmark_status?: BenchmarkStatus;
}

interface ProgressMonitoringChartProps {
  data: DataPoint[];
  studentName: string;
  gradeLevel: number;
  goalWCPM?: number;
  showGoalLine?: boolean;
  showBenchmarkLines?: boolean;
  height?: number;
}

export function ProgressMonitoringChart({
  data,
  studentName,
  gradeLevel,
  goalWCPM,
  showGoalLine = true,
  showBenchmarkLines = true,
  height = 300,
}: ProgressMonitoringChartProps) {
  const chartData = useMemo(() => {
    return data
      .map(d => ({
        ...d,
        date: format(parseISO(d.date), "MMM d"),
        rawDate: d.date,
      }))
      .sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());
  }, [data]);

  const period = getCurrentScreeningPeriod();
  const norm = getFluencyNorm(gradeLevel, period);
  
  // Calculate trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return null;
    
    const firstWCPM = chartData[0].wcpm;
    const lastWCPM = chartData[chartData.length - 1].wcpm;
    const change = lastWCPM - firstWCPM;
    
    const weeksBetween = Math.max(1, 
      (new Date(chartData[chartData.length - 1].rawDate).getTime() - 
       new Date(chartData[0].rawDate).getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    
    const weeklyGrowth = change / weeksBetween;
    const expectedGrowth = getExpectedWeeklyGrowth(gradeLevel);
    
    return {
      totalChange: change,
      weeklyGrowth: Math.round(weeklyGrowth * 10) / 10,
      expectedGrowth,
      isOnTrack: weeklyGrowth >= expectedGrowth * 0.8,
    };
  }, [chartData, gradeLevel]);

  const latestStatus = chartData.length > 0 
    ? chartData[chartData.length - 1].benchmark_status 
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{studentName} - WCPM Progress</CardTitle>
            <CardDescription>
              Grade {gradeLevel} • {period} Benchmark Period
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {latestStatus && <BenchmarkStatusBadge status={latestStatus} size="sm" />}
            {trend && (
              <div className={`flex items-center gap-1 text-sm ${
                trend.totalChange > 0 ? 'text-green-600' : 
                trend.totalChange < 0 ? 'text-red-600' : 'text-muted-foreground'
              }`}>
                {trend.totalChange > 0 ? <TrendingUp className="h-4 w-4" /> : 
                 trend.totalChange < 0 ? <TrendingDown className="h-4 w-4" /> : 
                 <Minus className="h-4 w-4" />}
                {trend.totalChange > 0 ? '+' : ''}{trend.totalChange} WCPM
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No assessment data available
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={height}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  label={{ value: 'WCPM', angle: -90, position: 'insideLeft', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value}${name === 'accuracy' ? '%' : ''}`,
                    name === 'wcpm' ? 'WCPM' : 'Accuracy'
                  ]}
                />
                <Legend />
                
                {/* Benchmark reference lines */}
                {showBenchmarkLines && norm && (
                  <>
                    <ReferenceLine 
                      y={norm.percentile50} 
                      stroke="hsl(var(--primary))" 
                      strokeDasharray="5 5"
                      label={{ value: '50th %ile', position: 'right', fontSize: 10 }}
                    />
                    <ReferenceLine 
                      y={norm.percentile25} 
                      stroke="hsl(142 76% 36%)" 
                      strokeDasharray="3 3"
                      label={{ value: '25th %ile', position: 'right', fontSize: 10 }}
                    />
                    <ReferenceLine 
                      y={norm.percentile10} 
                      stroke="hsl(0 84% 60%)" 
                      strokeDasharray="3 3"
                      label={{ value: '10th %ile', position: 'right', fontSize: 10 }}
                    />
                  </>
                )}
                
                {/* Goal line */}
                {showGoalLine && goalWCPM && (
                  <ReferenceLine 
                    y={goalWCPM} 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    label={{ value: `Goal: ${goalWCPM}`, position: 'right', fontSize: 10 }}
                  />
                )}
                
                {/* WCPM line */}
                <Line
                  type="monotone"
                  dataKey="wcpm"
                  name="WCPM"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                
                {/* Accuracy line (if data exists) */}
                {chartData.some(d => d.accuracy !== undefined) && (
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    name="Accuracy"
                    stroke="hsl(142 76% 36%)"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={{ fill: 'hsl(142 76% 36%)', strokeWidth: 1 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
            
            {/* Trend Summary */}
            {trend && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Weekly growth: <strong className={trend.isOnTrack ? 'text-green-600' : 'text-orange-600'}>
                      {trend.weeklyGrowth} WCPM/week
                    </strong>
                    {' '}(expected: {trend.expectedGrowth})
                  </span>
                </div>
                <span className={`text-sm font-medium ${trend.isOnTrack ? 'text-green-600' : 'text-orange-600'}`}>
                  {trend.isOnTrack ? '✓ On Track' : '⚠ Below Expected'}
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
