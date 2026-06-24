import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, TrendingUp, Star, Target, Zap, Award, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FullReadingStatsModal } from "./FullReadingStatsModal";
import { getReadingJourneyLevel } from "@/lib/readingJourneyLevel";

interface ReadingProgressPanelProps {
  studentId: string;
  studentName?: string;
  gradeMode?: string;
  layout?: 'vertical' | 'horizontal';
}

export const ReadingProgressPanel = ({ studentId, studentName = "Reader", gradeMode, layout = 'vertical' }: ReadingProgressPanelProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['reading-progress-panel', studentId, gradeMode],
    queryFn: async () => {
      let statsQuery = supabase
        .from('student_reading_stats')
        .select('*')
        .eq('student_id', studentId);
      if (gradeMode) statsQuery = statsQuery.eq('grade_mode', gradeMode);
      const { data: readingStats } = await statsQuery.maybeSingle();

      let sessionsQuery = supabase
        .from('reading_sessions')
        .select('accuracy_percent, wpm, wcpm, words_read')
        .eq('student_id', studentId);
      if (gradeMode) sessionsQuery = sessionsQuery.eq('grade_mode', gradeMode);
      const { data: sessions } = await sessionsQuery
        .order('created_at', { ascending: false })
        .limit(20);

      const avgWpm = sessions && sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.wcpm || s.wpm || 0), 0) / sessions.length)
        : 0;
      
      const avgAccuracy = sessions && sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.accuracy_percent || 0), 0) / sessions.length)
        : 0;

      const gradeInfo = getReadingJourneyLevel(avgWpm, gradeMode);

      let wpmTrend = 0;
      if (sessions && sessions.length >= 6) {
        const recent = sessions.slice(0, 5).reduce((sum, s) => sum + (s.wcpm || s.wpm || 0), 0) / 5;
        const older = sessions.slice(5, 10).reduce((sum, s) => sum + (s.wcpm || s.wpm || 0), 0) / Math.min(5, sessions.length - 5);
        wpmTrend = Math.round(recent - older);
      }

      const totalWordsInSessions = sessions?.reduce((sum, s) => sum + (s.words_read || 0), 0) || 0;
      const wordsMastered = Math.min(1000, Math.floor(totalWordsInSessions * (avgAccuracy / 100) / 3));

      return {
        readingLevel: gradeInfo.stepIndex,
        gradeLabel: gradeInfo.label,
        totalSteps: gradeInfo.totalSteps,
        avgWpm,
        avgAccuracy,
        wpmTrend,
        wordsMastered,
        streak: readingStats?.current_streak_days || 0,
        totalSessions: readingStats?.total_sessions || sessions?.length || 0,
      };
    },
    enabled: !!studentId,
    staleTime: 60000,
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-purple-900/80 to-indigo-900/80 rounded-xl p-4 border border-purple-500/30 backdrop-blur-sm max-w-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-purple-300" />
          <h3 className="text-sm font-bold text-white">My Reading Journey</h3>
        </div>

        <div className="bg-purple-800/50 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-purple-300">Reading Level</span>
            <span className="text-lg font-bold text-yellow-400">{stats.gradeLabel} Grade</span>
          </div>
         <div className="flex gap-1">
            {Array.from({ length: stats.totalSteps }).map((_, i) => (
              <motion.div
                key={i}
                className={`h-2 flex-1 rounded-full ${i <= stats.readingLevel ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-purple-700/50'}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: i * 0.05 }}
              />
            ))}
          </div>
          {stats.avgAccuracy > 0 && (
            <div className="mt-2 flex items-center justify-center">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                stats.avgAccuracy >= 97 ? 'bg-emerald-500/20 text-emerald-300' :
                stats.avgAccuracy >= 90 ? 'bg-amber-500/20 text-amber-300' :
                'bg-red-500/20 text-red-300'
              }`}>
                Fluency: {stats.avgAccuracy >= 97 ? 'Independent' : stats.avgAccuracy >= 90 ? 'Instructional' : 'Frustration'}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-blue-800/40 rounded-lg p-2 text-center">
            <Zap className="h-4 w-4 mx-auto text-blue-400 mb-1" />
            <div className="text-lg font-bold text-white">{stats.avgWpm}</div>
            <div className="text-xs text-blue-300">WCPM</div>
            {stats.wpmTrend !== 0 && (
              <div className={`text-xs flex items-center justify-center gap-0.5 ${stats.wpmTrend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                <TrendingUp className={`h-3 w-3 ${stats.wpmTrend < 0 ? 'rotate-180' : ''}`} />
                {stats.wpmTrend > 0 ? '+' : ''}{stats.wpmTrend}
              </div>
            )}
          </div>
          <div className="bg-green-800/40 rounded-lg p-2 text-center">
            <Target className="h-4 w-4 mx-auto text-green-400 mb-1" />
            <div className="text-lg font-bold text-white">{stats.avgAccuracy}%</div>
            <div className="text-xs text-green-300">Accuracy</div>
          </div>
          <div className="bg-amber-800/40 rounded-lg p-2 text-center">
            <Star className="h-4 w-4 mx-auto text-amber-400 mb-1" />
            <div className="text-lg font-bold text-white">{stats.wordsMastered >= 1000 ? '1k+' : stats.wordsMastered}</div>
            <div className="text-xs text-amber-300">Words Mastered</div>
          </div>
          <div className="bg-pink-800/40 rounded-lg p-2 text-center">
            <Award className="h-4 w-4 mx-auto text-pink-400 mb-1" />
            <div className="text-lg font-bold text-white">{stats.totalSessions}</div>
            <div className="text-xs text-pink-300">Stories Read</div>
          </div>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          variant="ghost"
          size="sm"
          className="w-full bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30"
        >
          View Full Stats <ChevronRight className="w-4 h-4 ml-1" />
        </Button>

        <motion.div
          className="text-center mt-3 text-xs text-purple-300"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {stats.streak >= 3 ? "🔥 You're on fire! Keep reading!" : stats.wpmTrend > 0 ? "📈 Getting faster every day!" : "📚 Every story makes you stronger!"}
        </motion.div>
      </motion.div>

      <FullReadingStatsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        studentId={studentId}
        studentName={studentName}
        gradeMode={gradeMode}
      />
    </>
  );
};
