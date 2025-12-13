import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, Target, Trophy, Sparkles } from "lucide-react";

interface ClassChallengeCardProps {
  studentId: string;
}

export const ClassChallengeCard = ({ studentId }: ClassChallengeCardProps) => {
  // Get student's classrooms and class-wide reading stats
  const { data: challengeData, isLoading } = useQuery({
    queryKey: ['class-challenge', studentId],
    queryFn: async () => {
      // Get student's classrooms
      const { data: enrollments } = await supabase
        .from('classroom_students')
        .select('classroom_id, classrooms(name)')
        .eq('student_id', studentId)
        .limit(1);

      if (!enrollments || enrollments.length === 0) return null;

      const classroomId = enrollments[0].classroom_id;
      const classroomName = (enrollments[0].classrooms as any)?.name || 'Class';

      // Get all students in this classroom
      const { data: classStudents } = await supabase
        .from('classroom_students')
        .select('student_id')
        .eq('classroom_id', classroomId);

      const studentIds = classStudents?.map(s => s.student_id) || [];

      // Get this week's reading sessions for the class
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('words_read')
        .in('student_id', studentIds)
        .gte('created_at', weekAgo.toISOString());

      const totalWordsThisWeek = sessions?.reduce((sum, s) => sum + (s.words_read || 0), 0) || 0;
      const weeklyGoal = 10000; // 10,000 words per week class goal
      const activeReaders = new Set(sessions?.map(s => s.words_read > 0)).size;

      return {
        classroomName,
        totalWordsThisWeek,
        weeklyGoal,
        activeReaders,
        studentCount: studentIds.length,
        progress: Math.min(100, (totalWordsThisWeek / weeklyGoal) * 100),
        isComplete: totalWordsThisWeek >= weeklyGoal,
      };
    },
    enabled: !!studentId,
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