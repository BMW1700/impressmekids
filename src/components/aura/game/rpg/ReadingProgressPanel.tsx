import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, TrendingUp, Star, Target, Zap, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ReadingProgressPanelProps {
  studentId: string;
}

export const ReadingProgressPanel = ({ studentId }: ReadingProgressPanelProps) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['reading-progress-panel', studentId],
    queryFn: async () => {
      // Fetch reading stats
      const { data: readingStats } = await supabase
        .from('student_reading_stats')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      // Fetch recent AURA records for trends
      const { data: recentRecords } = await supabase
        .from('aura_records')
        .select('grade, wpm, created_at')
        .eq('profile_id', studentId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch reading sessions for accuracy
      const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('accuracy_percent, wpm, wcpm, words_read, fluency_score')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Calculate reading level (based on WPM and accuracy)
      const avgWpm = sessions && sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.wpm || 0), 0) / sessions.length)
        : 0;
      
      const avgAccuracy = sessions && sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.accuracy_percent || 0), 0) / sessions.length)
        : 0;

      // Reading level calculation (1-10 scale based on WPM benchmarks)
      let readingLevel = 1;
      if (avgWpm >= 150 && avgAccuracy >= 95) readingLevel = 10;
      else if (avgWpm >= 130 && avgAccuracy >= 93) readingLevel = 9;
      else if (avgWpm >= 115 && avgAccuracy >= 91) readingLevel = 8;
      else if (avgWpm >= 100 && avgAccuracy >= 89) readingLevel = 7;
      else if (avgWpm >= 85 && avgAccuracy >= 87) readingLevel = 6;
      else if (avgWpm >= 70 && avgAccuracy >= 85) readingLevel = 5;
      else if (avgWpm >= 55 && avgAccuracy >= 82) readingLevel = 4;
      else if (avgWpm >= 45 && avgAccuracy >= 80) readingLevel = 3;
      else if (avgWpm >= 35 && avgAccuracy >= 75) readingLevel = 2;

      // Calculate WPM trend (last 5 vs previous 5)
      let wpmTrend = 0;
      if (sessions && sessions.length >= 6) {
        const recent = sessions.slice(0, 5).reduce((sum, s) => sum + (s.wpm || 0), 0) / 5;
        const older = sessions.slice(5, 10).reduce((sum, s) => sum + (s.wpm || 0), 0) / Math.min(5, sessions.length - 5);
        wpmTrend = Math.round(recent - older);
      }

      // Calculate words mastered (rough estimate based on total words read with high accuracy)
      const totalWordsInSessions = sessions?.reduce((sum, s) => sum + (s.words_read || 0), 0) || 0;
      const avgSessionAccuracy = avgAccuracy / 100;
      const wordsMastered = Math.min(1000, Math.floor(totalWordsInSessions * avgSessionAccuracy / 3)); // Estimate unique words

      // Focus areas (would need phoneme data for real implementation)
      const focusAreas: string[] = [];
      if (avgAccuracy < 85) focusAreas.push("Accuracy practice");
      if (avgWpm < 60) focusAreas.push("Speed building");
      if (wpmTrend < 0) focusAreas.push("Consistency");

      return {
        readingLevel,
        avgWpm,
        avgAccuracy,
        wpmTrend,
        wordsMastered,
        totalWordsRead: readingStats?.total_words_read || 0,
        streak: readingStats?.current_streak_days || 0,
        totalSessions: readingStats?.total_sessions || 0,
        focusAreas,
      };
    },
    enabled: !!studentId,
    staleTime: 60000, // 1 minute
  });

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-gradient-to-br from-purple-900/80 to-indigo-900/80 rounded-xl p-4 border border-purple-500/30 backdrop-blur-sm"
      >
        <Skeleton className="h-4 w-32 mb-3 bg-purple-700/50" />
        <Skeleton className="h-20 w-full bg-purple-700/50" />
      </motion.div>
    );
  }

  if (!stats) return null;

  const getLevelGrade = (level: number) => {
    const grades = ['K', '1st', '1st', '2nd', '2nd', '3rd', '3rd', '4th', '5th', '5th+'];
    return grades[level - 1] || 'K';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gradient-to-br from-purple-900/80 to-indigo-900/80 rounded-xl p-4 border border-purple-500/30 backdrop-blur-sm max-w-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-purple-300" />
        <h3 className="text-sm font-bold text-white">My Reading Journey</h3>
      </div>

      {/* Reading Level */}
      <div className="bg-purple-800/50 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-purple-300">Reading Level</span>
          <span className="text-lg font-bold text-yellow-400">
            {getLevelGrade(stats.readingLevel)} Grade
          </span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i < stats.readingLevel 
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500' 
                  : 'bg-purple-700/50'
              }`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.05 }}
            />
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* WPM */}
        <div className="bg-blue-800/40 rounded-lg p-2 text-center">
          <Zap className="h-4 w-4 mx-auto text-blue-400 mb-1" />
          <div className="text-lg font-bold text-white">{stats.avgWpm}</div>
          <div className="text-xs text-blue-300">Words/Min</div>
          {stats.wpmTrend !== 0 && (
            <div className={`text-xs flex items-center justify-center gap-0.5 ${
              stats.wpmTrend > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              <TrendingUp className={`h-3 w-3 ${stats.wpmTrend < 0 ? 'rotate-180' : ''}`} />
              {stats.wpmTrend > 0 ? '+' : ''}{stats.wpmTrend}
            </div>
          )}
        </div>

        {/* Accuracy */}
        <div className="bg-green-800/40 rounded-lg p-2 text-center">
          <Target className="h-4 w-4 mx-auto text-green-400 mb-1" />
          <div className="text-lg font-bold text-white">{stats.avgAccuracy}%</div>
          <div className="text-xs text-green-300">Accuracy</div>
        </div>

        {/* Words Mastered */}
        <div className="bg-amber-800/40 rounded-lg p-2 text-center">
          <Star className="h-4 w-4 mx-auto text-amber-400 mb-1" />
          <div className="text-lg font-bold text-white">
            {stats.wordsMastered >= 1000 ? '1k+' : stats.wordsMastered}
          </div>
          <div className="text-xs text-amber-300">Words Mastered</div>
        </div>

        {/* Sessions */}
        <div className="bg-pink-800/40 rounded-lg p-2 text-center">
          <Award className="h-4 w-4 mx-auto text-pink-400 mb-1" />
          <div className="text-lg font-bold text-white">{stats.totalSessions}</div>
          <div className="text-xs text-pink-300">Stories Read</div>
        </div>
      </div>

      {/* Focus Areas */}
      {stats.focusAreas.length > 0 && (
        <div className="bg-orange-800/30 rounded-lg p-2 border border-orange-500/30">
          <div className="text-xs text-orange-300 mb-1">🎯 Focus Areas:</div>
          <div className="flex flex-wrap gap-1">
            {stats.focusAreas.map((area, i) => (
              <span 
                key={i} 
                className="text-xs bg-orange-700/50 text-orange-200 px-2 py-0.5 rounded-full"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Encouragement message */}
      <motion.div
        className="text-center mt-3 text-xs text-purple-300"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {stats.streak >= 3 ? "🔥 You're on fire! Keep reading!" : 
         stats.wpmTrend > 0 ? "📈 Getting faster every day!" :
         "📚 Every story makes you stronger!"}
      </motion.div>
    </motion.div>
  );
};
