import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Flame, Zap, Trophy, Sparkles, TrendingUp, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { GradeMode } from "@/lib/gameTheme";

interface KidFriendlyProgressProps {
  studentId: string;
  gradeMode?: GradeMode;
}

const KidFriendlyProgress = ({ studentId, gradeMode }: KidFriendlyProgressProps) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['kid-progress-stats', studentId, gradeMode],
    queryFn: async () => {
      // Fetch reading stats
      let readingQuery = supabase
        .from('student_reading_stats')
        .select('*')
        .eq('student_id', studentId);
      if (gradeMode) {
        readingQuery = readingQuery.eq('grade_mode', gradeMode);
      }
      const { data: readingStats } = await readingQuery.maybeSingle();

      // Fetch recent AURA records for WPM trend
      const { data: recentRecords } = await supabase
        .from('aura_records')
        .select('grade, wpm, created_at')
        .eq('profile_id', studentId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate reading level (1-10 based on avg grade)
      const avgGrade = recentRecords && recentRecords.length > 0
        ? recentRecords.reduce((sum, r) => sum + (r.grade ?? 0), 0) / recentRecords.length
        : 0;
      const readingLevel = Math.min(10, Math.max(1, Math.ceil(avgGrade / 10)));

      // Calculate WPM trend
      let wpmTrend = 0;
      if (recentRecords && recentRecords.length >= 4) {
        const recent = recentRecords.slice(0, 2).reduce((sum, r) => sum + r.wpm, 0) / 2;
        const older = recentRecords.slice(-2).reduce((sum, r) => sum + r.wpm, 0) / 2;
        wpmTrend = recent - older;
      }

      return {
        totalWords: readingStats?.total_words_read || 0,
        streak: readingStats?.current_streak_days || 0,
        longestStreak: readingStats?.longest_streak_days || 0,
        storiesCompleted: readingStats?.total_sessions || 0,
        readingLevel,
        avgGrade: Math.round(avgGrade),
        wpmTrend: Math.round(wpmTrend),
        avgWpm: recentRecords && recentRecords.length > 0
          ? Math.round(recentRecords.reduce((sum, r) => sum + r.wpm, 0) / recentRecords.length)
          : 0,
      };
    },
    enabled: !!studentId,
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardContent className="p-6">
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  // Generate encouraging message based on performance
  const getMessage = () => {
    if (stats.streak >= 7) return "🔥 You're on FIRE! Amazing streak!";
    if (stats.wpmTrend > 10) return "🚀 You're getting faster! Keep it up!";
    if (stats.avgGrade >= 80) return "⭐ Superstar reader! You're doing amazing!";
    if (stats.storiesCompleted >= 10) return "📚 Bookworm alert! So many stories!";
    if (stats.streak >= 3) return "💪 Great consistency! Keep reading daily!";
    return "📖 Every story makes you stronger! Let's read!";
  };

  // Generate star display (filled vs empty)
  const renderStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-8 w-8 ${
          i < Math.ceil(level / 2)
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-muted-foreground/30'
        }`}
      />
    ));
  };

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 border-purple-500/20 overflow-hidden">
      <CardContent className="p-6 space-y-6">
        {/* Header with encouraging message */}
        <div className="text-center">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Your Reading Journey
          </h3>
          <p className="text-lg font-medium mt-2 animate-pulse">
            {getMessage()}
          </p>
        </div>

        {/* Reading Level with Stars */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-1">
            {renderStars(stats.readingLevel)}
          </div>
          <p className="text-lg font-semibold">
            Level {stats.readingLevel} Reader
          </p>
          <div className="h-4 bg-muted rounded-full overflow-hidden max-w-xs mx-auto">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 transition-all duration-1000 ease-out"
              style={{ width: `${stats.avgGrade}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {stats.avgGrade}% to next level
          </p>
        </div>

        {/* Fun Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Streak */}
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-4 text-center border border-orange-500/30">
            <Flame className="h-10 w-10 mx-auto text-orange-500 mb-2" />
            <div className="text-3xl font-bold text-orange-600">{stats.streak}</div>
            <p className="text-sm font-medium">Day Streak</p>
          </div>

          {/* Speed */}
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-4 text-center border border-blue-500/30">
            <Zap className="h-10 w-10 mx-auto text-blue-500 mb-2" />
            <div className="text-3xl font-bold text-blue-600">{stats.avgWpm}</div>
            <p className="text-sm font-medium">Words/Min</p>
            {stats.wpmTrend > 0 && (
              <div className="flex items-center justify-center gap-1 text-green-600 text-xs mt-1">
                <TrendingUp className="h-3 w-3" />
                +{stats.wpmTrend}
              </div>
            )}
          </div>

          {/* Stories */}
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-4 text-center border border-purple-500/30">
            <BookOpen className="h-10 w-10 mx-auto text-purple-500 mb-2" />
            <div className="text-3xl font-bold text-purple-600">{stats.storiesCompleted}</div>
            <p className="text-sm font-medium">Stories Read</p>
          </div>

          {/* Total Words */}
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-4 text-center border border-green-500/30">
            <Sparkles className="h-10 w-10 mx-auto text-green-500 mb-2" />
            <div className="text-3xl font-bold text-green-600">
              {stats.totalWords >= 1000 
                ? `${(stats.totalWords / 1000).toFixed(1)}k` 
                : stats.totalWords}
            </div>
            <p className="text-sm font-medium">Words Read</p>
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {stats.streak >= 3 && (
            <div className="flex items-center gap-2 bg-orange-500/20 px-4 py-2 rounded-full border border-orange-500/30">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium">Hot Streak!</span>
            </div>
          )}
          {stats.storiesCompleted >= 5 && (
            <div className="flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-full border border-purple-500/30">
              <BookOpen className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">Bookworm</span>
            </div>
          )}
          {stats.avgGrade >= 70 && (
            <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500/30">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium">Star Reader</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KidFriendlyProgress;
