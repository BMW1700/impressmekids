import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Flame, Star, BookOpen, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface GamificationHeaderProps {
  studentId: string;
  gradeMode?: string;
}

export const GamificationHeader = ({ studentId, gradeMode }: GamificationHeaderProps) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['gamification-stats', studentId, gradeMode],
    queryFn: async () => {
      let query = supabase
        .from('student_reading_stats')
        .select('*')
        .eq('student_id', studentId);
      if (gradeMode) query = query.eq('grade_mode', gradeMode);
      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  const { data: achievementCount } = useQuery({
    queryKey: ['achievement-count', studentId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('reading_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!studentId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Streak */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
          <Flame className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black text-orange-600">{stats?.current_streak_days || 0}</span>
          <span className="text-[10px] text-muted-foreground -mt-1">day streak</span>
        </div>
      </div>

      {/* XP */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Star className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black text-purple-600">{stats?.xp_points || 0}</span>
          <span className="text-[10px] text-muted-foreground -mt-1">XP</span>
        </div>
      </div>

      {/* Words Read */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <BookOpen className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black text-blue-600">{(stats?.total_words_read || 0).toLocaleString()}</span>
          <span className="text-[10px] text-muted-foreground -mt-1">words</span>
        </div>
      </div>

      {/* Achievements */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
          <Trophy className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black text-yellow-600">{achievementCount || 0}</span>
          <span className="text-[10px] text-muted-foreground -mt-1">badges</span>
        </div>
      </div>
    </div>
  );
};