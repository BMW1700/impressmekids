import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Zap, Volume2, BookOpen, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProsodyInsightsProps {
  records: any[];
  skillVectors: any[];
  classroomId?: string;
}

const ProsodyInsights = ({ records, skillVectors, classroomId }: ProsodyInsightsProps) => {
  // Fetch reading sessions for the classroom students
  const { data: readingSessions, isLoading } = useQuery({
    queryKey: ['prosody-reading-sessions', classroomId],
    queryFn: async () => {
      if (!classroomId) return [];
      
      // Get students in classroom
      const { data: students } = await supabase
        .from('classroom_students')
        .select('student_id')
        .eq('classroom_id', classroomId);
      
      if (!students || students.length === 0) return [];
      
      const studentIds = students.map(s => s.student_id);
      
      const { data, error } = await supabase
        .from('reading_sessions')
        .select('*')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false })
        .limit(200);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!classroomId,
  });

  // Aggregate prosody metrics from BOTH practice records AND reading sessions
  const aggregateProsody = () => {
    const pitchVariances: number[] = [];
    const speakingRates: number[] = [];
    const confidenceScores: number[] = [];
    const readingAccuracies: number[] = [];
    const fluencyScores: number[] = [];

    // From practice/aura records
    records.forEach((record) => {
      if (record.wpm) speakingRates.push(record.wpm);
      if (record.confidence) confidenceScores.push(record.confidence);
      
      const vector = skillVectors.find((v) => v.student_id === record.profile_id);
      if (vector?.prosody_metrics?.pitch_variance) {
        pitchVariances.push(vector.prosody_metrics.pitch_variance);
      }
    });

    // From reading sessions (READ-ALONG data)
    if (readingSessions) {
      readingSessions.forEach((session: any) => {
        if (session.wpm) speakingRates.push(session.wpm);
        if (session.accuracy_percent) readingAccuracies.push(session.accuracy_percent);
        if (session.fluency_score) fluencyScores.push(session.fluency_score);
      });
    }

    return { pitchVariances, speakingRates, confidenceScores, readingAccuracies, fluencyScores };
  };

  const { pitchVariances, speakingRates, confidenceScores, readingAccuracies, fluencyScores } = aggregateProsody();

  // Calculate averages
  const avgPitchVariance = pitchVariances.length > 0
    ? Math.round(pitchVariances.reduce((a, b) => a + b, 0) / pitchVariances.length)
    : null;
  
  const avgWPM = speakingRates.length > 0
    ? Math.round(speakingRates.reduce((a, b) => a + b, 0) / speakingRates.length)
    : 0;

  const avgConfidence = confidenceScores.length > 0
    ? Math.round((confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length) * 100) / 100
    : 0;

  const avgReadingAccuracy = readingAccuracies.length > 0
    ? Math.round(readingAccuracies.reduce((a, b) => a + b, 0) / readingAccuracies.length)
    : 0;

  const avgFluency = fluencyScores.length > 0
    ? Math.round(fluencyScores.reduce((a, b) => a + b, 0) / fluencyScores.length)
    : 0;

  // Speaking rate distribution (combined)
  const rateDistribution = [
    { range: "< 100", count: speakingRates.filter((r) => r < 100).length },
    { range: "100-130", count: speakingRates.filter((r) => r >= 100 && r < 130).length },
    { range: "130-160", count: speakingRates.filter((r) => r >= 130 && r < 160).length },
    { range: "160-190", count: speakingRates.filter((r) => r >= 160 && r < 190).length },
    { range: "> 190", count: speakingRates.filter((r) => r >= 190).length },
  ];

  // Class-wide insights
  const insights = [];
  
  if (avgWPM > 180) {
    insights.push({
      type: "warning",
      icon: <Zap className="w-4 h-4" />,
      message: `Class speaks too quickly (avg ${avgWPM} WPM). Target: 130-160 WPM.`,
    });
  } else if (avgWPM < 110 && avgWPM > 0) {
    insights.push({
      type: "warning",
      icon: <Zap className="w-4 h-4" />,
      message: `Class speaks slowly (avg ${avgWPM} WPM). Encourage more fluency.`,
    });
  }

  if (avgPitchVariance && avgPitchVariance < 30) {
    insights.push({
      type: "warning",
      icon: <Volume2 className="w-4 h-4" />,
      message: "Low pitch variance indicates monotone speech. Practice expressiveness.",
    });
  }

  if (avgReadingAccuracy > 0 && avgReadingAccuracy < 70) {
    insights.push({
      type: "warning",
      icon: <BookOpen className="w-4 h-4" />,
      message: `Reading accuracy needs work (${avgReadingAccuracy}%). Focus on decoding skills.`,
    });
  } else if (avgReadingAccuracy >= 90) {
    insights.push({
      type: "info",
      icon: <TrendingUp className="w-4 h-4" />,
      message: `Excellent reading accuracy (${avgReadingAccuracy}%)! Class is progressing well.`,
    });
  }

  if (avgConfidence > 0 && avgConfidence < 3) {
    insights.push({
      type: "info",
      icon: <TrendingUp className="w-4 h-4" />,
      message: "Overall confidence is developing. Positive reinforcement recommended.",
    });
  }

  const totalSessions = (records?.length || 0) + (readingSessions?.length || 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          Prosody & Fluency Insights
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Speaking quality analysis from {totalSessions} sessions (practice + read-along)
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading fluency data...</span>
          </div>
        ) : (
          <>
            {/* Key Metrics - Updated to show reading data */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold">{avgWPM || '-'}</p>
                <p className="text-xs text-muted-foreground">Avg WPM</p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  Target: 130-160
                </Badge>
              </div>
              <div className="text-center p-4 border rounded-lg bg-primary/5">
                <p className="text-2xl font-bold text-primary">{avgReadingAccuracy || '-'}%</p>
                <p className="text-xs text-muted-foreground">Reading Accuracy</p>
                <Badge variant="default" className="mt-1 text-xs">
                  Read-Along
                </Badge>
              </div>
              <div className="text-center p-4 border rounded-lg bg-primary/5">
                <p className="text-2xl font-bold text-primary">{avgFluency || '-'}</p>
                <p className="text-xs text-muted-foreground">Fluency Score</p>
                <Badge variant="default" className="mt-1 text-xs">
                  Read-Along
                </Badge>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold">{avgConfidence > 0 ? avgConfidence.toFixed(1) : '-'}/5</p>
                <p className="text-xs text-muted-foreground">Avg Confidence</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold">
                  {avgPitchVariance !== null ? avgPitchVariance : "-"}
                </p>
                <p className="text-xs text-muted-foreground">Pitch Variance</p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  Expressiveness
                </Badge>
              </div>
            </div>

            {/* Data source breakdown */}
            <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm">
              <div className="flex items-center gap-4">
                <span className="font-medium">Data Sources:</span>
                <Badge variant="outline">{records?.length || 0} Practice Sessions</Badge>
                <Badge variant="default">{readingSessions?.length || 0} Read-Along Sessions</Badge>
              </div>
            </div>

            {/* Speaking Rate Distribution */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Speaking Rate Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={rateDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Class-Wide Insights */}
            {insights.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Class-Wide Patterns</h3>
                {insights.map((insight, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 p-3 rounded-lg ${
                      insight.type === "warning"
                        ? "bg-orange-500/10 border border-orange-500/50"
                        : "bg-blue-500/10 border border-blue-500/50"
                    }`}
                  >
                    {insight.icon}
                    <p className="text-sm">{insight.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Prosody Coaching Tips */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h3 className="text-sm font-medium mb-2">💡 Prosody Coaching Tips</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Encourage students to vary pitch when reading dialogue</li>
                <li>Practice emphasizing key words in sentences</li>
                <li>Use poetry and dramatic readings to build expressiveness</li>
                <li>Record and playback to build self-awareness</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProsodyInsights;