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
      grade: record.grade ?? 0,
      pronunciation: (record.pronunciation ?? 0) * 20,
      clarity: (record.clarity ?? 0) * 20,
      confidence: (record.confidence ?? 0) * 20,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Speaking Practice Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-foreground" />
              <YAxis domain={[0, 100]} className="text-foreground" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
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
          <p className="mt-4 text-xs text-muted-foreground text-center">
            Based on {records.length} speaking practice {records.length === 1 ? 'clip' : 'clips'}. Reading fluency stats are shown above.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AuraProgressChart;
