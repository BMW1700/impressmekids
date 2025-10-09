import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";

interface AuraProgressChartProps {
  records: any[];
}

const AuraProgressChart = ({ records }: AuraProgressChartProps) => {
  const chartData = records
    .slice(0, 10)
    .reverse()
    .map((record) => ({
      date: format(new Date(record.created_at), 'MMM d'),
      grade: record.grade,
      pronunciation: record.pronunciation * 20,
      clarity: record.clarity * 20,
      confidence: record.confidence * 20,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Progress Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="grade" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Overall Grade"
              />
              <Line 
                type="monotone" 
                dataKey="pronunciation" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2}
                name="Pronunciation"
              />
              <Line 
                type="monotone" 
                dataKey="clarity" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                name="Clarity"
              />
              <Line 
                type="monotone" 
                dataKey="confidence" 
                stroke="hsl(var(--chart-3))" 
                strokeWidth={2}
                name="Confidence"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Complete practice sessions to see your progress
          </div>
        )}

        {records.length > 0 && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{records.length}</div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {Math.round(records.reduce((sum, r) => sum + r.grade, 0) / records.length)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Grade</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {Math.round(records.reduce((sum, r) => sum + r.wpm, 0) / records.length)}
              </div>
              <div className="text-sm text-muted-foreground">Avg WPM</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {(records.reduce((sum, r) => sum + r.pronunciation, 0) / records.length).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Pronunciation</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuraProgressChart;
