import { useMemo } from "react";
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
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { format, startOfWeek, parseISO } from "date-fns";

interface ClassroomWeeklyBreakdownProps {
  readingSessions: any[];
  students: any[];
}

interface WeekData {
  weekStart: string;
  activeStudents: number;
  avgWcpm: number;
  avgAccuracy: number;
  totalWordsRead: number;
  totalSessions: number;
}

const ClassroomWeeklyBreakdown = ({ readingSessions, students }: ClassroomWeeklyBreakdownProps) => {
  const weeklyData = useMemo(() => {
    if (!readingSessions || readingSessions.length === 0) return [];

    const weekMap = new Map<string, { wcpms: number[]; accuracies: number[]; wordsRead: number; sessions: number; studentIds: Set<string> }>();

    readingSessions.forEach((session) => {
      const weekStart = format(startOfWeek(parseISO(session.created_at), { weekStartsOn: 1 }), "yyyy-MM-dd");
      
      if (!weekMap.has(weekStart)) {
        weekMap.set(weekStart, { wcpms: [], accuracies: [], wordsRead: 0, sessions: 0, studentIds: new Set() });
      }
      
      const week = weekMap.get(weekStart)!;
      if (session.wpm) week.wcpms.push(session.wpm);
      if (session.accuracy_percent) week.accuracies.push(Math.min(100, session.accuracy_percent));
      week.wordsRead += session.words_read || 0;
      week.sessions += 1;
      week.studentIds.add(session.student_id);
    });

    const weeks: WeekData[] = Array.from(weekMap.entries())
      .map(([weekStart, data]) => ({
        weekStart,
        activeStudents: data.studentIds.size,
        avgWcpm: data.wcpms.length > 0 ? Math.round(data.wcpms.reduce((a, b) => a + b, 0) / data.wcpms.length) : 0,
        avgAccuracy: data.accuracies.length > 0 ? Math.round(data.accuracies.reduce((a, b) => a + b, 0) / data.accuracies.length) : 0,
        totalWordsRead: data.wordsRead,
        totalSessions: data.sessions,
      }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
      .slice(-8);

    return weeks;
  }, [readingSessions]);

  if (weeklyData.length === 0) {
    return (
      <Card className="border-0 bg-muted/30">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <BarChart3 className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-sm">
            Classroom weekly trends will appear after students complete reading sessions
          </p>
        </CardContent>
      </Card>
    );
  }

  const firstWeek = weeklyData[0];
  const lastWeek = weeklyData[weeklyData.length - 1];
  const wcpmGrowth = lastWeek.avgWcpm - firstWeek.avgWcpm;
  const accuracyGrowth = lastWeek.avgAccuracy - firstWeek.avgAccuracy;

  const chartData = weeklyData.map((week) => ({
    week: format(parseISO(week.weekStart), "MMM d"),
    "Avg WPM": week.avgWcpm,
    "Avg Accuracy": week.avgAccuracy,
    "Active Students": week.activeStudents,
  }));

  return (
    <div className="space-y-6">
      {/* Summary badges */}
      <Card className="border-0 bg-gradient-to-br from-primary/5 to-secondary/5 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Classroom Weekly Reading Trends
            </span>
            <div className="flex gap-2 flex-wrap">
              {wcpmGrowth !== 0 && (
                <Badge className={wcpmGrowth > 0 ? "bg-green-500/20 text-green-700 border-0" : "bg-red-500/20 text-red-700 border-0"}>
                  {wcpmGrowth > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {wcpmGrowth > 0 ? "+" : ""}{wcpmGrowth} WPM
                </Badge>
              )}
              {accuracyGrowth !== 0 && (
                <Badge className={accuracyGrowth > 0 ? "bg-blue-500/20 text-blue-700 border-0" : "bg-red-500/20 text-red-700 border-0"}>
                  {accuracyGrowth > 0 ? "+" : ""}{accuracyGrowth}% Accuracy
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="Avg WPM" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                <Line yAxisId="right" type="monotone" dataKey="Avg Accuracy" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={{ fill: "hsl(142, 76%, 36%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly breakdown table */}
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Week</th>
                  <th className="text-center p-3">Active Students</th>
                  <th className="text-center p-3">Sessions</th>
                  <th className="text-center p-3">Avg WPM</th>
                  <th className="text-center p-3">WPM Δ</th>
                  <th className="text-center p-3">Accuracy</th>
                  <th className="text-center p-3">Words Read</th>
                </tr>
              </thead>
              <tbody>
                {[...weeklyData].reverse().map((week, i, arr) => {
                  const prevWeek = arr[i + 1];
                  const wcpmDelta = prevWeek ? week.avgWcpm - prevWeek.avgWcpm : 0;
                  return (
                    <tr key={week.weekStart} className="border-t">
                      <td className="p-3 font-medium">{format(parseISO(week.weekStart), "MMM d")}</td>
                      <td className="text-center p-3">
                        {week.activeStudents}/{students?.length || "?"}
                      </td>
                      <td className="text-center p-3">{week.totalSessions}</td>
                      <td className="text-center p-3 font-semibold">{week.avgWcpm}</td>
                      <td className="text-center p-3">
                        {wcpmDelta !== 0 && (
                          <span className={wcpmDelta > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            {wcpmDelta > 0 ? "+" : ""}{wcpmDelta}
                          </span>
                        )}
                      </td>
                      <td className="text-center p-3">
                        <Badge variant={week.avgAccuracy >= 80 ? "default" : "secondary"}>
                          {week.avgAccuracy}%
                        </Badge>
                      </td>
                      <td className="text-center p-3">{week.totalWordsRead.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassroomWeeklyBreakdown;
