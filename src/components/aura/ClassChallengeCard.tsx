import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, Target, Trophy, Sparkles } from "lucide-react";

interface ClassChallengeCardProps {
  studentId: string;
  gradeMode?: string;
}

export const ClassChallengeCard = ({ studentId, gradeMode }: ClassChallengeCardProps) => {
  // Get student's classrooms and class-wide reading stats
  const { data: challengeData, isLoading } = useQuery({
    queryKey: ['class-challenge', studentId, gradeMode],
    queryFn: async () => {
      // Step 1: Get student's first classroom
      const { data: enrollments } = await supabase
        .from('classroom_students')
        .select('classroom_id, classrooms(name)')
        .eq('student_id', studentId)
        .limit(1);

      if (!enrollments || enrollments.length === 0) return null;

      const classroomId = enrollments[0].classroom_id;
      const classroomName = (enrollments[0].classrooms as any)?.name || 'Class';

      // Step 2: Get student count (lightweight)
      const { count: studentCount } = await supabase
        .from('classroom_students')
        .select('student_id', { count: 'exact', head: true })
        .eq('classroom_id', classroomId);

      // Step 3: Get student IDs in this classroom
      const { data: classStudents } = await supabase
        .from('classroom_students')
        .select('student_id')
        .eq('classroom_id', classroomId);

      const studentIds = classStudents?.map(s => s.student_id) || [];
      if (studentIds.length === 0) {
        return {
          classroomName,
          totalWordsThisWeek: 0,
          weeklyGoal: 10000,
          activeReaders: 0,
          studentCount: 0,
          progress: 0,
          isComplete: false,
        };
      }

      // Step 4: Get this week's reading sessions — scoped by gradeMode
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      let sessionsQuery = supabase
        .from('reading_sessions')
        .select('student_id, words_read')
        .in('student_id', studentIds)
        .gte('created_at', weekAgo.toISOString())
        .limit(500);
      if (gradeMode) sessionsQuery = sessionsQuery.eq('grade_mode', gradeMode);

      const { data: sessions } = await sessionsQuery;

      // Aggregate locally
      const totalWordsThisWeek = sessions?.reduce((sum, s) => sum + (s.words_read || 0), 0) || 0;
      
      const activeReaderSet = new Set<string>();
      sessions?.forEach(s => {
        if (s.words_read > 0 && s.student_id) {
          activeReaderSet.add(s.student_id);
        }
      });
      const activeReaders = activeReaderSet.size;

      const weeklyGoal = 10000;

      return {
        classroomName,
        totalWordsThisWeek,
        weeklyGoal,
        activeReaders,
        studentCount: studentCount || 0,
        progress: Math.min(100, (totalWordsThisWeek / weeklyGoal) * 100),
        isComplete: totalWordsThisWeek >= weeklyGoal,
      };
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !challengeData) {
    return null;
  }

  return (
    <Card variant="glass" className="relative overflow-hidden hover-lift">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      
      {challengeData.isComplete && (
        <div className="absolute top-3 right-3">
          <Badge variant="green" className="shadow-glow-green animate-pulse">
            <Trophy className="h-3 w-3 mr-1" />
            Goal Reached!
          </Badge>
        </div>
      )}

      <CardHeader className="pb-2 pt-5">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-blue-500" />
          {challengeData.classroomName} Weekly Challenge
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Class Goal: {challengeData.weeklyGoal.toLocaleString()} words</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span className="font-bold text-purple-600">{challengeData.activeReaders}</span>
            <span className="text-xs text-muted-foreground">readers</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-black text-gradient-primary">
              {challengeData.totalWordsThisWeek.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              / {challengeData.weeklyGoal.toLocaleString()} words
            </span>
          </div>
          
          <Progress 
            value={challengeData.progress} 
            variant="premium" 
            gradient={challengeData.isComplete ? "green" : "purple"}
            className="h-4" 
          />
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {challengeData.isComplete 
            ? "🎉 Amazing! Your class hit the weekly goal!" 
            : `${(challengeData.weeklyGoal - challengeData.totalWordsThisWeek).toLocaleString()} more words to go!`
          }
        </p>
      </CardContent>
    </Card>
  );
};