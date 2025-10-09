import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface PhonemeProgressChartProps {
  records: any[];
  studentName: string;
}

const TRACKED_PHONEMES = ["/r/", "/θ/", "/l/", "/s/"];
const PHONEME_COLORS = {
  "/r/": "#3b82f6",
  "/θ/": "#10b981",
  "/l/": "#f59e0b",
  "/s/": "#8b5cf6",
};

const PhonemeProgressChart = ({ records, studentName }: PhonemeProgressChartProps) => {
  // Process last 12 weeks of data
  const chartData = records
    .slice(0, 12)
    .reverse()
    .map((record) => {
      const dataPoint: any = {
        date: format(new Date(record.created_at), "MMM d"),
        fullDate: record.created_at,
      };

      TRACKED_PHONEMES.forEach((phoneme) => {
        const phonemeData = record.evidence?.phoneme_accuracy?.find(
          (p: any) => p.phoneme === phoneme
        );
        dataPoint[phoneme] = phonemeData ? Math.round(phonemeData.accuracy * 100) : null;
      });

      return dataPoint;
    });

  // Detect plateaus (no improvement >5% in 4 weeks)
  const detectPlateaus = () => {
    const plateaus: string[] = [];
    
    TRACKED_PHONEMES.forEach((phoneme) => {
      const recentScores = chartData
        .slice(-4)
        .map((d) => d[phoneme])
        .filter((s): s is number => s !== null);

      if (recentScores.length >= 4) {
        const min = Math.min(...recentScores);
        const max = Math.max(...recentScores);
        if (max - min < 5) {
          plateaus.push(phoneme);
        }
      }
    });

    return plateaus;
  };

  const plateaus = detectPlateaus();

  // Calculate improvement deltas
  const getImprovement = (phoneme: string) => {
    const scores = chartData.map((d) => d[phoneme]).filter((s): s is number => s !== null);
    if (scores.length < 2) return null;
    
    const first = scores[0];
    const last = scores[scores.length - 1];
    const delta = last - first;
    
    return { delta, weeks: scores.length };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phoneme Progress Trajectory - {studentName}</CardTitle>
        <p className="text-sm text-muted-foreground">12-week phoneme accuracy tracking</p>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No practice sessions recorded yet
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} label={{ value: "Accuracy %", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />
                {TRACKED_PHONEMES.map((phoneme) => (
                  <Line
                    key={phoneme}
                    type="monotone"
                    dataKey={phoneme}
                    stroke={PHONEME_COLORS[phoneme as keyof typeof PHONEME_COLORS]}
                    strokeWidth={2}
                    name={phoneme}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>

            {/* Improvement Summary */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {TRACKED_PHONEMES.map((phoneme) => {
                const improvement = getImprovement(phoneme);
                const isPlateaued = plateaus.includes(phoneme);

                return (
                  <div key={phoneme} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{phoneme}</span>
                      {isPlateaued && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Plateau
                        </Badge>
                      )}
                    </div>
                    {improvement && (
                      <div className="flex items-center gap-1">
                        {improvement.delta > 5 ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : improvement.delta < -5 ? (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        ) : (
                          <Minus className="w-4 h-4 text-yellow-500" />
                        )}
                        <span className="text-sm font-bold">
                          {improvement.delta > 0 ? "+" : ""}
                          {improvement.delta}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({improvement.weeks}w)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Plateau Alert */}
            {plateaus.length > 0 && (
              <div className="mt-4 p-4 border border-orange-500/50 rounded-lg bg-orange-500/10">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Plateau Detected</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {plateaus.join(", ")} haven't improved significantly in 4 weeks. 
                      Consider targeted intervention.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PhonemeProgressChart;
