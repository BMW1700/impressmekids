import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardCardProps {
  classroomId: string;
  currentStudentId?: string;
  title?: string;
}

interface ReadingLeaderboardEntry {
  student_id: string;
  student_name: string;
  avatar_url: string | null;
  total_words_read: number;
  avg_wpm: number;
  avg_accuracy: number;
  current_streak: number;
}

export const LeaderboardCard = ({ classroomId, currentStudentId, title = "Reading Leaderboard" }: LeaderboardCardProps) => {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['reading-leaderboard', classroomId],
    queryFn: async () => {
      // Get all students in the classroom
      const { data: students, error: studentsError } = await supabase
        .from('classroom_students')
        .select('student_id, profiles!student_id(full_name, student_profiles(avatar_url))')
        .eq('classroom_id', classroomId);

      if (studentsError) throw studentsError;

      // Get reading stats for all students
      const studentIds = students?.map(s => s.student_id) || [];
      
      const { data: stats, error: statsError } = await supabase
        .from('student_reading_stats')
        .select('*')
        .in('student_id', studentIds);

      if (statsError) throw statsError;

      // Get session averages for WPM and accuracy
      const { data: sessions, error: sessionsError } = await supabase
        .from('reading_sessions')
        .select('student_id, wpm, accuracy_percent')
        .in('student_id', studentIds);

      if (sessionsError) throw sessionsError;

      // Calculate averages per student
      const averages = studentIds.map(id => {
        const studentSessions = sessions?.filter(s => s.student_id === id) || [];
        const avgWpm = studentSessions.length > 0
          ? Math.round(studentSessions.reduce((sum, s) => sum + s.wpm, 0) / studentSessions.length)
          : 0;
        const avgAccuracy = studentSessions.length > 0
          ? Math.round(studentSessions.reduce((sum, s) => sum + s.accuracy_percent, 0) / studentSessions.length)
          : 0;
        return { student_id: id, avgWpm, avgAccuracy };
      });

      // Combine data
      const leaderboardData: ReadingLeaderboardEntry[] = students?.map(student => {
        const studentStats = stats?.find(s => s.student_id === student.student_id);
        const studentAvgs = averages.find(a => a.student_id === student.student_id);
        const profile = student.profiles as any;
        
        return {
          student_id: student.student_id,
          student_name: profile?.full_name || 'Unknown Student',
          avatar_url: profile?.student_profiles?.[0]?.avatar_url || null,
          total_words_read: studentStats?.total_words_read || 0,
          avg_wpm: studentAvgs?.avgWpm || 0,
          avg_accuracy: studentAvgs?.avgAccuracy || 0,
          current_streak: studentStats?.current_streak_days || 0,
        };
      }).filter(entry => entry.total_words_read > 0) || [];

      // Sort by total words read
      return leaderboardData.sort((a, b) => b.total_words_read - a.total_words_read).slice(0, 10);
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No reading activity yet. Start reading to appear on the leaderboard!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const isCurrentStudent = entry.student_id === currentStudentId;
            const rank = index + 1;

            return (
              <div
                key={entry.student_id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isCurrentStudent
                    ? 'bg-primary/10 ring-2 ring-primary'
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <div className="text-2xl font-bold w-12 text-center">
                  {getRankIcon(rank)}
                </div>

                <Avatar className="h-10 w-10">
                  <AvatarImage src={entry.avatar_url || undefined} />
                  <AvatarFallback>
                    {entry.student_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {entry.student_name}
                    {isCurrentStudent && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        You
                      </Badge>
                    )}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{entry.total_words_read.toLocaleString()} words</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {entry.avg_wpm} WPM
                    </span>
                    {entry.current_streak > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          🔥 {entry.current_streak} day{entry.current_streak !== 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <Badge variant="outline" className="text-xs">
                  {entry.avg_accuracy}%
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
