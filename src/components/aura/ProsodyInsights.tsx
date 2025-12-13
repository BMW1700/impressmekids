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

  // Fetch student names for display
  const { data: studentProfiles } = useQuery({
    queryKey: ['prosody-student-names', classroomId],
    queryFn: async () => {
      if (!classroomId) return [];
      
      const { data: students } = await supabase
        .from('classroom_students')
        .select('student_id')
        .eq('classroom_id', classroomId);
      
      if (!students || students.length === 0) return [];
      
      const studentIds = students.map(s => s.student_id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!classroomId,
  });

  // Create name lookup map
  const nameMap = new Map<string, string>();
  studentProfiles?.forEach(p => nameMap.set(p.id, p.full_name || 'Unknown Student'));

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

  // Calculate individual student stats from reading sessions
  const getStudentStats = () => {
    if (!readingSessions || readingSessions.length === 0) return [];
    
    const studentMap = new Map<string, { 
      studentId: string;
      name: string;
      sessions: any[];
    }>();
    
    // Get student names from classroom_students query context
    readingSessions.forEach((session: any) => {
      if (!studentMap.has(session.student_id)) {
        studentMap.set(session.student_id, {
          studentId: session.student_id,
          name: session.student_id, // Will be replaced with actual name
          sessions: []
        });
      }
      studentMap.get(session.student_id)?.sessions.push(session);
    });
    
    return Array.from(studentMap.values()).map(student => {
      const sessions = student.sessions;
      const avgWpm = sessions.length > 0 
        ? Math.round(sessions.reduce((sum, s) => sum + (s.wpm || 0), 0) / sessions.length)
        : 0;
      const avgAccuracy = sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.accuracy_percent || 0), 0) / sessions.length)
        : 0;
      const avgFluency = sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.fluency_score || 0), 0) / sessions.length)
        : 0;
      
      return {
        studentId: student.studentId,
        sessionCount: sessions.length,
        avgWpm,
        avgAccuracy,
        avgFluency,
      };
    }).sort((a, b) => b.sessionCount - a.sessionCount);
  };

  const studentStats = getStudentStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          Reading Fluency Insights
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          How well students read aloud • {totalSessions} total sessions
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
            {/* Class Averages */}
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-3">Class Averages</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">{avgWPM || '-'}</p>
                  <p className="text-xs text-muted-foreground">Words/Minute</p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Target: 130-160
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded-lg bg-primary/5">
                  <p className="text-2xl font-bold text-primary">{avgReadingAccuracy || '-'}%</p>
                  <p className="text-xs text-muted-foreground">Reading Accuracy</p>
                </div>
                <div className="text-center p-4 border rounded-lg bg-primary/5">
                  <p className="text-2xl font-bold text-primary">{avgFluency || '-'}</p>
                  <p className="text-xs text-muted-foreground">Fluency Score</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">{avgConfidence > 0 ? avgConfidence.toFixed(1) : '-'}/5</p>
                  <p className="text-xs text-muted-foreground">Confidence</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">
                    {avgPitchVariance !== null ? avgPitchVariance : "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">Expressiveness</p>
                </div>
              </div>
            </div>

            {/* Individual Student Stats Table */}
            {studentStats.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Individual Student Performance</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-3 text-left font-medium">Student</th>
                        <th className="p-3 text-center font-medium">Sessions</th>
                        <th className="p-3 text-center font-medium">WPM</th>
                        <th className="p-3 text-center font-medium">Accuracy</th>
                        <th className="p-3 text-center font-medium">Fluency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentStats.slice(0, 10).map((student, idx) => (
                        <tr key={student.studentId} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                          <td className="p-3 font-medium">
                            {nameMap.get(student.studentId) || `Student ${idx + 1}`}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="outline">{student.sessionCount}</Badge>
                          </td>
                          <td className="p-3 text-center">
                            <span className={student.avgWpm >= 130 && student.avgWpm <= 160 ? 'text-green-600 font-semibold' : ''}>
                              {student.avgWpm}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={student.avgAccuracy >= 90 ? 'default' : student.avgAccuracy >= 70 ? 'secondary' : 'destructive'}>
                              {student.avgAccuracy}%
                            </Badge>
                          </td>
                          <td className="p-3 text-center">{student.avgFluency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {studentStats.length > 10 && (
                    <div className="p-2 text-center text-xs text-muted-foreground bg-muted/30">
                      Showing top 10 of {studentStats.length} students
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Speaking Rate Distribution */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Reading Speed Distribution</h3>
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
              <div className="space-y-2 mb-6">
                <h3 className="text-sm font-medium">Class Patterns</h3>
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

            {/* Coaching Tips */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="text-sm font-medium mb-2">💡 Teaching Tips</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Have students vary their voice when reading dialogue</li>
                <li>Practice emphasizing important words</li>
                <li>Use poetry to build expression</li>
                <li>Let students record and listen to themselves</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProsodyInsights;