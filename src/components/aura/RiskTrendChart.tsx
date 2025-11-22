import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRiskHistory } from "@/hooks/useRiskHistory";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp } from "lucide-react";

interface RiskTrendChartProps {
  studentId: string;
  studentName: string;
}

const RiskTrendChart = ({ studentId, studentName }: RiskTrendChartProps) => {
  const { data: history = [], isLoading } = useRiskHistory(studentId, 30);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Score Trend - {studentName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No historical data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = history.map((record) => ({
    date: new Date(record.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    riskScore: record.risk_score,
    level: record.risk_level,
  }));

  const firstScore = history[0]?.risk_score || 0;
  const lastScore = history[history.length - 1]?.risk_score || 0;
  const trend = lastScore - firstScore;
  const isImproving = trend < 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Risk Score Trend - {studentName}</span>
          <div className="flex items-center gap-2">
            {isImproving ? (
              <>
                <TrendingDown className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-600 font-medium">
                  Improving ({Math.abs(trend).toFixed(0)} points)
                </span>
              </>
            ) : trend === 0 ? (
              <span className="text-sm text-muted-foreground font-medium">Stable</span>
            ) : (
              <>
                <TrendingUp className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-600 font-medium">
                  Worsening (+{trend.toFixed(0)} points)
                </span>
              </>
            )}
          </div>
        </CardTitle>
        <p className="text-sm text-muted-foreground">Last 30 days</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="riskScore"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))" }}
              name="Risk Score"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Current</p>
            <p className="text-2xl font-bold">{lastScore}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">30 Days Ago</p>
            <p className="text-2xl font-bold">{firstScore}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Change</p>
            <p className={`text-2xl font-bold ${isImproving ? "text-green-600" : trend === 0 ? "" : "text-red-600"}`}>
              {trend > 0 ? "+" : ""}{trend.toFixed(0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskTrendChart;
