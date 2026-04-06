import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { TrendingUp, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CrossModalScatterPlotProps {
  students: any[];
  skillVectors: any[];
  auraRecords: any[];
  classroomId?: string;
  gradeMode?: string;
}

interface StudentPoint {
  id: string;
  name: string;
  speakingScore: number;
  readingScore: number;
  riskScore: number;
  quadrant: string;
  readingSessions: number;
  speakingSessions: number;
}

const CrossModalScatterPlot = ({ students, skillVectors, auraRecords, classroomId, gradeMode }: CrossModalScatterPlotProps) => {
  const [selectedStudent, setSelectedStudent] = useState<StudentPoint | null>(null);

  // Fetch reading sessions to get READ-ALONG performance — scoped by gradeMode
  const studentIds = students.map(s => s.student_id);
  const { data: readingSessions, isLoading } = useQuery({
    queryKey: ['cross-modal-reading-sessions', studentIds, gradeMode],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      let query = supabase
        .from('reading_sessions')
        .select('student_id, accuracy_percent, wpm, fluency_score')
        .in('student_id', studentIds);
      if (gradeMode) query = query.eq('grade_mode', gradeMode);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: studentIds.length > 0,
  });

  // Debug: Log the incoming data
  console.log('[CrossModal] Students:', students.length, 'Aura Records:', auraRecords?.length || 0, 'Reading Sessions:', readingSessions?.length || 0);

  // Prepare data points combining aura_records (speaking) AND reading_sessions (read-along)
  const dataPoints: StudentPoint[] = students.map(student => {
    const vector = skillVectors.find(v => v.student_id === student.student_id);
    const studentAuraRecords = auraRecords?.filter(r => r.profile_id === student.student_id) || [];
    
    // Speaking data from aura_records (practice sessions AND presentations)
    // Include records with reading_type='speaking' OR presentation_type is set
    const speakingRecords = studentAuraRecords.filter(r => 
      r.reading_type === 'speaking' || 
      r.presentation_type || 
      !r.reading_type // legacy records without reading_type
    );
    
    // Calculate speaking score from grade field OR presentation_metrics.overallScore
    const avgSpeakingScore = speakingRecords.length > 0
      ? Math.round(speakingRecords.reduce((sum, r) => {
          // Prefer grade if available, otherwise use presentation_metrics.overallScore
          const score = r.grade || 
            (r.presentation_metrics && typeof r.presentation_metrics === 'object' 
              ? (r.presentation_metrics as any).overallScore 
              : 0) || 0;
          return sum + score;
        }, 0) / speakingRecords.length)
      : 0;
    
    // CRITICAL: Reading data from reading_sessions table (read-along sessions)
    const studentReadingSessions = readingSessions?.filter((s: any) => s.student_id === student.student_id) || [];
    const avgReadingScore = studentReadingSessions.length > 0
      ? Math.round(studentReadingSessions.reduce((sum: number, s: any) => sum + (s.accuracy_percent || 0), 0) / studentReadingSessions.length)
      : 0;

    const riskScore = vector?.cross_modal_risk_score || 0;

    // Determine quadrant
    let quadrant = "Low Both";
    if (avgSpeakingScore >= 70 && avgReadingScore >= 70) quadrant = "Excelling";
    else if (avgSpeakingScore >= 70 && avgReadingScore < 70) quadrant = "Strong Speaker";
    else if (avgSpeakingScore < 70 && avgReadingScore >= 70) quadrant = "Strong Reader";

    // Debug: Log per-student calculation
    if (speakingRecords.length > 0 || studentReadingSessions.length > 0) {
      console.log(`[CrossModal] ${student.profiles?.full_name}: Speaking=${avgSpeakingScore} (${speakingRecords.length} records), Reading=${avgReadingScore} (${studentReadingSessions.length} sessions)`);
    }

    return {
      id: student.student_id,
      name: student.profiles?.full_name || 'Unknown',
      speakingScore: avgSpeakingScore,
      readingScore: avgReadingScore,
      riskScore,
      quadrant,
      readingSessions: studentReadingSessions.length,
      speakingSessions: speakingRecords.length,
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
            <p>Speaking: <strong>{data.speakingScore}/100</strong> ({data.speakingSessions} sessions)</p>
            <p>Reading: <strong>{data.readingScore}/100</strong> ({data.readingSessions} sessions)</p>
            <p>Risk: <Badge variant={data.riskScore > 60 ? "destructive" : "secondary"} className="text-xs">{data.riskScore}/100</Badge></p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="shadow-elegant border-2 border-primary/20">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading cross-modal data...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elegant border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          Reading vs Speaking Skills
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Compare how students perform in reading aloud vs speaking practice • {dataPoints.length} students with data
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Simple Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="font-semibold text-green-700 dark:text-green-400">⭐ Strong in Both</div>
              <div className="text-muted-foreground">Keep challenging them!</div>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="font-semibold text-blue-700 dark:text-blue-400">📚 Strong Reader</div>
              <div className="text-muted-foreground">Needs speaking practice</div>
            </div>
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <div className="font-semibold text-purple-700 dark:text-purple-400">🎤 Strong Speaker</div>
              <div className="text-muted-foreground">Needs reading practice</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="font-semibold text-amber-700 dark:text-amber-400">⚠️ Needs Support</div>
              <div className="text-muted-foreground">Focus on both areas</div>
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
                  label={{ value: 'Speaking Score (Practice)', position: 'bottom', offset: 0 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="readingScore" 
                  name="Reading Score" 
                  domain={[0, 100]}
                  label={{ value: 'Reading Score (Read-Along)', angle: -90, position: 'insideLeft' }}
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
              <p className="text-sm">Students need both speaking practice AND read-along sessions</p>
            </div>
          )}

          {selectedStudent && (
            <div className="mt-4 p-4 border-2 border-primary rounded-lg bg-primary/5 animate-fade-in">
              <p className="text-sm font-semibold mb-2">Selected: {selectedStudent.name}</p>
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Speaking</div>
                  <div className="font-bold">{selectedStudent.speakingScore}/100</div>
                  <div className="text-xs text-muted-foreground">{selectedStudent.speakingSessions} sessions</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Reading</div>
                  <div className="font-bold">{selectedStudent.readingScore}/100</div>
                  <div className="text-xs text-muted-foreground">{selectedStudent.readingSessions} sessions</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Risk</div>
                  <Badge variant={selectedStudent.riskScore > 60 ? "destructive" : "secondary"}>
                    {selectedStudent.riskScore}
                  </Badge>
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