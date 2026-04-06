import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useClassroomReadingSessions } from "@/hooks/useReadingSessions";
import { Loader2, TrendingUp, Target, Zap, Book } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format } from "date-fns";
import type { GradeMode } from "@/lib/gameTheme";

interface ReadingProgressDashboardProps {
  classroomId: string;
  gradeMode?: GradeMode;
}

export const ReadingProgressDashboard = ({ classroomId, gradeMode }: ReadingProgressDashboardProps) => {
  const { data: sessions, isLoading } = useClassroomReadingSessions(classroomId, gradeMode);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Reading Data Yet</CardTitle>
          <CardDescription>
            Reading analytics will appear here once students complete word-by-word reading sessions.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Calculate class averages - cap accuracy at 100% to handle corrupted data
  const avgWpm = Math.round(sessions.reduce((sum, s) => sum + (s.wpm || 0), 0) / sessions.length);
  const avgAccuracy = Math.min(100, Math.round(sessions.reduce((sum, s) => sum + Math.min(100, s.accuracy_percent || 0), 0) / sessions.length));
  const totalWordsRead = sessions.reduce((sum, s) => sum + (s.words_read || 0), 0);
  const avgFluency = Math.round(sessions.reduce((sum, s) => sum + (s.fluency_score || 0), 0) / sessions.length);

  // Prepare WPM trend data (last 30 days)
  const wpmTrendData = sessions
    .slice(0, 30)
    .reverse()
    .map(session => ({
      date: format(new Date(session.created_at), 'MMM dd'),
      wpm: session.wpm,
      accuracy: session.accuracy_percent,
      student: (session.profiles as any)?.full_name?.split(' ')[0] || 'Student',
    }));

  // Student performance ranking
  const studentPerformance = sessions.reduce((acc, session) => {
    const studentName = (session.profiles as any)?.full_name || 'Unknown';
    if (!acc[studentName]) {
      acc[studentName] = { name: studentName, wpm: [], accuracy: [], sessions: 0 };
    }
    acc[studentName].wpm.push(session.wpm || 0);
    acc[studentName].accuracy.push(session.accuracy_percent || 0);
    acc[studentName].sessions += 1;
    return acc;
  }, {} as Record<string, { name: string; wpm: number[]; accuracy: number[]; sessions: number }>);

  const studentRankingData = Object.values(studentPerformance)
    .map(student => ({
      name: student.name,
      avgWpm: Math.round(student.wpm.reduce((a, b) => a + b, 0) / student.wpm.length),
      avgAccuracy: Math.round(student.accuracy.reduce((a, b) => a + b, 0) / student.accuracy.length),
      sessions: student.sessions,
    }))
    .sort((a, b) => b.avgWpm - a.avgWpm)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Avg WPM</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgWpm}</div>
            <p className="text-xs text-muted-foreground">words per minute</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Avg Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAccuracy}%</div>
            <p className="text-xs text-muted-foreground">correct words</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Words Read</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWordsRead.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">across all students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Fluency</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgFluency}/100</div>
            <p className="text-xs text-muted-foreground">fluency score</p>
          </CardContent>
        </Card>
      </div>

      {/* WPM & Accuracy Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Reading Progress Over Time</CardTitle>
          <CardDescription>Class WPM and accuracy trends</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={wpmTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="wpm"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="WPM"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="accuracy"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                name="Accuracy %"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Student Performance Ranking */}
      <Card>
        <CardHeader>
          <CardTitle>Top Readers</CardTitle>
          <CardDescription>Students ranked by average WPM</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={studentRankingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgWpm" fill="hsl(var(--primary))" name="Avg WPM" />
              <Bar dataKey="avgAccuracy" fill="hsl(var(--secondary))" name="Avg Accuracy %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reading Sessions</CardTitle>
          <CardDescription>Last 10 reading sessions across the class</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.slice(0, 10).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium">
                    {(session.profiles as any)?.full_name || 'Unknown Student'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(session.created_at), 'MMM dd, yyyy h:mm a')}
                  </p>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-primary">{session.wpm}</p>
                    <p className="text-muted-foreground">WPM</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-secondary">{session.accuracy_percent}%</p>
                    <p className="text-muted-foreground">Accuracy</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{session.words_read}</p>
                    <p className="text-muted-foreground">Words</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
