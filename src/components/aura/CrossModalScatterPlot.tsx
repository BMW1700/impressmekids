import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { TrendingUp, Sparkles } from "lucide-react";
import { useState } from "react";

interface CrossModalScatterPlotProps {
  students: any[];
  skillVectors: any[];
  auraRecords: any[];
}

interface StudentPoint {
  id: string;
  name: string;
  speakingScore: number;
  readingScore: number;
  riskScore: number;
  quadrant: string;
}

const CrossModalScatterPlot = ({ students, skillVectors, auraRecords }: CrossModalScatterPlotProps) => {
  const [selectedStudent, setSelectedStudent] = useState<StudentPoint | null>(null);

  // Prepare data points
  const dataPoints: StudentPoint[] = students.map(student => {
    const vector = skillVectors.find(v => v.student_id === student.student_id);
    const studentRecords = auraRecords?.filter(r => r.profile_id === student.student_id) || [];
    const readingRecords = studentRecords.filter(r => r.reading_type === 'reading');
    const speakingRecords = studentRecords.filter(r => r.reading_type === 'speaking');

    const avgReadingScore = readingRecords.length > 0
      ? Math.round(readingRecords.reduce((sum, r) => sum + (r.grade || 0), 0) / readingRecords.length)
      : 0;
    
    const avgSpeakingScore = speakingRecords.length > 0
      ? Math.round(speakingRecords.reduce((sum, r) => sum + (r.grade || 0), 0) / speakingRecords.length)
      : 0;

    const riskScore = vector?.cross_modal_risk_score || 0;

    // Determine quadrant
    let quadrant = "Low Both";
    if (avgSpeakingScore >= 70 && avgReadingScore >= 70) quadrant = "Excelling";
    else if (avgSpeakingScore >= 70 && avgReadingScore < 70) quadrant = "Strong Speaker";
    else if (avgSpeakingScore < 70 && avgReadingScore >= 70) quadrant = "Strong Reader";

    return {
      id: student.student_id,
      name: student.profiles?.full_name || 'Unknown',
      speakingScore: avgSpeakingScore,
      readingScore: avgReadingScore,
      riskScore,
      quadrant,
    };
  }).filter(p => p.speakingScore > 0 || p.readingScore > 0);

  const getPointColor = (riskScore: number) => {
    if (riskScore > 60) return "hsl(0, 70%, 50%)"; // Red
    if (riskScore > 30) return "hsl(45, 85%, 50%)"; // Yellow
    return "hsl(140, 60%, 45%)"; // Green
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border-2 border-primary rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-1">{data.name}</p>
          <p className="text-xs text-muted-foreground mb-2">{data.quadrant}</p>
          <div className="space-y-1 text-xs">
            <p>Speaking: <strong>{data.speakingScore}/100</strong></p>
            <p>Reading: <strong>{data.readingScore}/100</strong></p>
            <p>Risk: <Badge variant={data.riskScore > 60 ? "destructive" : "secondary"} className="text-xs">{data.riskScore}/100</Badge></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-elegant border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          Cross-Modal Performance Matrix
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Interactive scatter plot showing speaking vs reading performance
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quadrant Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="font-semibold text-green-700 dark:text-green-400">Top Right: Excelling</div>
              <div className="text-muted-foreground">Strong in both</div>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="font-semibold text-blue-700 dark:text-blue-400">Top Left: Strong Reader</div>
              <div className="text-muted-foreground">Needs speaking</div>
            </div>
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <div className="font-semibold text-purple-700 dark:text-purple-400">Bottom Right: Strong Speaker</div>
              <div className="text-muted-foreground">Needs reading</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="font-semibold text-amber-700 dark:text-amber-400">Bottom Left: Needs Support</div>
              <div className="text-muted-foreground">Both areas</div>
            </div>
          </div>

          {dataPoints.length > 0 ? (
            <ResponsiveContainer width="100%" height={500}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 30 }}>
                {/* Quadrant background regions */}
                <defs>
                  <linearGradient id="topRight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(140, 60%, 45%)" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="hsl(140, 60%, 45%)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="topLeft" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(210, 70%, 50%)" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="hsl(210, 70%, 50%)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="bottomRight" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="hsl(270, 60%, 50%)" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="hsl(270, 60%, 50%)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="bottomLeft" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="hsl(45, 70%, 50%)" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="hsl(45, 70%, 50%)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                
                {/* Quadrant dividers */}
                <ReferenceLine y={70} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={2} />
                <ReferenceLine x={70} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={2} />
                
                <XAxis 
                  type="number" 
                  dataKey="speakingScore" 
                  name="Speaking Score" 
                  domain={[0, 100]}
                  label={{ value: 'Speaking Score', position: 'bottom', offset: 0 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="readingScore" 
                  name="Reading Score" 
                  domain={[0, 100]}
                  label={{ value: 'Reading Score', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                
                <Scatter 
                  data={dataPoints} 
                  onClick={(data) => setSelectedStudent(data)}
                  animationDuration={800}
                  animationBegin={100}
                >
                  {dataPoints.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getPointColor(entry.riskScore)} 
                      r={8}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[500px] flex flex-col items-center justify-center text-muted-foreground">
              <TrendingUp className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">No cross-modal data available yet</p>
              <p className="text-sm">Students need both speaking and reading practice</p>
            </div>
          )}

          {selectedStudent && (
            <div className="mt-4 p-4 border-2 border-primary rounded-lg bg-primary/5 animate-fade-in">
              <p className="text-sm font-semibold mb-2">Selected: {selectedStudent.name}</p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Speaking</div>
                  <div className="font-bold">{selectedStudent.speakingScore}/100</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Reading</div>
                  <div className="font-bold">{selectedStudent.readingScore}/100</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Quadrant</div>
                  <Badge variant="outline">{selectedStudent.quadrant}</Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CrossModalScatterPlot;
