import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Clock, TrendingUp, Users, Download } from "lucide-react";
import { format } from "date-fns";

interface DrillMetric {
  drill_id: string;
  drill_type: string;
  started_at: string;
  ended_at: string | null;
  total_students: number;
  accounted_within_2min: number;
  accounted_within_5min: number;
  completion_time_minutes: number | null;
}

export function SafetyAnalytics() {
  const [drills, setDrills] = useState<DrillMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrillMetrics();
  }, []);

  const fetchDrillMetrics = async () => {
    try {
      const { data: drillSessions } = await supabase
        .from('drill_sessions')
        .select('*')
        .eq('status', 'completed')
        .order('started_at', { ascending: false })
        .limit(20);

      if (!drillSessions) {
        setDrills([]);
        setLoading(false);
        return;
      }

      const metrics: DrillMetric[] = [];

      for (const session of drillSessions) {
        const { data: attendance } = await supabase
          .from('drill_attendance')
          .select('marked_at, status')
          .eq('drill_session_id', session.id);

        if (!attendance) continue;

        const total = attendance.length;
        const startTime = new Date(session.started_at!);
        const accountedWithin2Min = attendance.filter(
          (a) =>
            a.status === 'present' &&
            a.marked_at &&
            (new Date(a.marked_at).getTime() - startTime.getTime()) / 60000 <= 2
        ).length;

        const accountedWithin5Min = attendance.filter(
          (a) =>
            a.status === 'present' &&
            a.marked_at &&
            (new Date(a.marked_at).getTime() - startTime.getTime()) / 60000 <= 5
        ).length;

        let completionTime = null;
        if (session.ended_at && session.started_at) {
          completionTime =
            (new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60000;
        }

        metrics.push({
          drill_id: session.id,
          drill_type: session.drill_type,
          started_at: session.started_at!,
          ended_at: session.ended_at,
          total_students: total,
          accounted_within_2min: accountedWithin2Min,
          accounted_within_5min: accountedWithin5Min,
          completion_time_minutes: completionTime
        });
      }

      setDrills(metrics);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching drill metrics:', error);
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Drill Type',
      'Total Students',
      'Accounted in 2min',
      'Accounted in 5min',
      'Completion Time (min)'
    ];
    
    const rows = drills.map((drill) => [
      format(new Date(drill.started_at), 'yyyy-MM-dd HH:mm'),
      drill.drill_type,
      drill.total_students.toString(),
      drill.accounted_within_2min.toString(),
      drill.accounted_within_5min.toString(),
      drill.completion_time_minutes?.toFixed(2) || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drill-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (drills.length === 0) {
    return (
      <Card className="p-12 text-center">
        <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Drill Data</h3>
        <p className="text-muted-foreground">
          Complete some drills to see analytics and performance metrics
        </p>
      </Card>
    );
  }

  const avgCompletionTime =
    drills
      .filter((d) => d.completion_time_minutes !== null)
      .reduce((sum, d) => sum + d.completion_time_minutes!, 0) / drills.filter((d) => d.completion_time_minutes !== null).length;

  const avg2MinRate =
    (drills.reduce((sum, d) => sum + (d.accounted_within_2min / d.total_students) * 100, 0) / drills.length).toFixed(1);

  const avg5MinRate =
    (drills.reduce((sum, d) => sum + (d.accounted_within_5min / d.total_students) * 100, 0) / drills.length).toFixed(1);

  const chartData = drills
    .slice(0, 10)
    .reverse()
    .map((drill) => ({
      date: format(new Date(drill.started_at), 'MM/dd'),
      completion_time: drill.completion_time_minutes?.toFixed(2) || 0,
      accounted_2min: ((drill.accounted_within_2min / drill.total_students) * 100).toFixed(1),
      accounted_5min: ((drill.accounted_within_5min / drill.total_students) * 100).toFixed(1)
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Drill Performance Analytics</h2>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{avgCompletionTime.toFixed(1)} min</div>
              <div className="text-sm text-muted-foreground">Avg Completion Time</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Target: &lt; 5 minutes
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{avg2MinRate}%</div>
              <div className="text-sm text-muted-foreground">Accounted in 2 Min</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Target: &gt; 80%
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">{avg5MinRate}%</div>
              <div className="text-sm text-muted-foreground">Accounted in 5 Min</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Target: &gt; 95%
          </div>
        </Card>
      </div>

      {/* Performance Trend Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Drill Performance Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" label={{ value: '% Accounted', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Time (min)', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="accounted_2min"
              stroke="#22c55e"
              name="% in 2 min"
              strokeWidth={2}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="accounted_5min"
              stroke="#3b82f6"
              name="% in 5 min"
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="completion_time"
              stroke="#f59e0b"
              name="Completion Time"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Drill History Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Drill History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Date</th>
                <th className="text-left py-2 px-4">Type</th>
                <th className="text-right py-2 px-4">Students</th>
                <th className="text-right py-2 px-4">2 Min %</th>
                <th className="text-right py-2 px-4">5 Min %</th>
                <th className="text-right py-2 px-4">Time (min)</th>
              </tr>
            </thead>
            <tbody>
              {drills.map((drill) => (
                <tr key={drill.drill_id} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-4">{format(new Date(drill.started_at), 'MMM dd, yyyy HH:mm')}</td>
                  <td className="py-2 px-4 capitalize">{drill.drill_type}</td>
                  <td className="py-2 px-4 text-right">{drill.total_students}</td>
                  <td className="py-2 px-4 text-right">
                    {((drill.accounted_within_2min / drill.total_students) * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-4 text-right">
                    {((drill.accounted_within_5min / drill.total_students) * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-4 text-right">
                    {drill.completion_time_minutes?.toFixed(2) || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
