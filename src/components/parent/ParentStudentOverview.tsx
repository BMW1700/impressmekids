import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  GraduationCap, 
  BookOpen, 
  Trophy, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  AlertTriangle,
  Mic,
  Star
} from "lucide-react";
import { format } from "date-fns";
import { useStudentGradebook } from "@/hooks/useStudentGradebook";
import { useDueToday } from "@/hooks/useDueToday";

interface ParentStudentOverviewProps {
  studentId: string;
  studentName: string;
}

export const ParentStudentOverview = ({ studentId, studentName }: ParentStudentOverviewProps) => {
  const { data: gradebook, isLoading: gradebookLoading } = useStudentGradebook(studentId);
  const { data: dueTodayData, isLoading: dueLoading } = useDueToday(studentId);

  // Get student's classroom info
  const { data: studentClassrooms } = useQuery({
    queryKey: ["parent-student-classrooms", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classroom_students")
        .select(`
          classroom_id,
          classrooms (
            id,
            name,
            subject,
            profiles:teacher_id (
              full_name
            )
          )
        `)
        .eq("student_id", studentId);

      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  // Get AURA reading stats
  const { data: auraStats } = useQuery({
    queryKey: ["parent-aura-stats", studentId],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("aura_records")
        .select("wpm, clarity, confidence, created_at")
        .eq("profile_id", studentId)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) return null;

      const avgWpm = data.reduce((sum, r) => sum + r.wpm, 0) / data.length;
      const avgClarity = data.reduce((sum, r) => sum + r.clarity, 0) / data.length;
      const avgConfidence = data.reduce((sum, r) => sum + r.confidence, 0) / data.length;
      const latestWpm = data[0].wpm;
      const oldestWpm = data[data.length - 1].wpm;
      const wpmImprovement = latestWpm - oldestWpm;

      return {
        sessionsCount: data.length,
        avgWpm: Math.round(avgWpm),
        avgClarity: Math.round(avgClarity),
        avgConfidence: Math.round(avgConfidence),
        wpmImprovement: Math.round(wpmImprovement),
        latestSession: data[0].created_at,
      };
    },
    enabled: !!studentId,
  });

  // Get behavior points
  const { data: behaviorStats } = useQuery({
    queryKey: ["parent-behavior-stats", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_behavior_stats")
        .select("*")
        .eq("student_id", studentId);

      if (error) throw error;

      if (!data || data.length === 0) return { totalPoints: 0, weeklyPoints: 0, streak: 0 };

      const totalPoints = data.reduce((sum, s) => sum + (s.total_points || 0), 0);
      const weeklyPoints = data.reduce((sum, s) => sum + (s.weekly_points || 0), 0);
      const bestStreak = Math.max(...data.map((s) => s.current_streak || 0));

      return { totalPoints, weeklyPoints, streak: bestStreak };
    },
    enabled: !!studentId,
  });

  // Calculate overall stats
  const overallGrade = gradebook && gradebook.length > 0
    ? gradebook.reduce((sum, c) => sum + (c.finalGrade || c.currentGrade || 0), 0) / gradebook.length
    : null;

  const totalUpcoming = dueTodayData?.dueToday?.length || 0;
  const totalPastDue = dueTodayData?.pastDue?.length || 0;
  const totalAssignmentsCompleted = gradebook?.reduce((sum, c) => 
    sum + c.assignments.filter(a => 
      a.status === "Graded" || 
      a.status === "Submitted" || 
      a.status === "Submitted Late"
    ).length, 0
  ) || 0;

  const getGradeColor = (grade: number | null) => {
    if (!grade) return "text-muted-foreground";
    if (grade >= 90) return "text-green-600";
    if (grade >= 80) return "text-blue-600";
    if (grade >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeBg = (grade: number | null) => {
    if (!grade) return "bg-muted";
    if (grade >= 90) return "bg-green-500/10";
    if (grade >= 80) return "bg-blue-500/10";
    if (grade >= 70) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };

  const initials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Student Header Card - Glassy */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 shadow-[var(--shadow-glass-lg)]">
        <div className="absolute inset-0 bg-[var(--gradient-glass)] backdrop-blur-xl" />
        <CardContent className="relative pt-6">
          <div className="flex items-start gap-6 flex-wrap">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-20 w-20 ring-4 ring-primary/20 shadow-lg">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary-dark text-2xl font-bold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {behaviorStats && behaviorStats.streak >= 3 && (
                <div className="absolute -bottom-1 -right-1 bg-secondary text-secondary-foreground rounded-full p-1 shadow-md">
                  <Star className="h-4 w-4" />
                </div>
              )}
            </div>

            {/* Student Info */}
            <div className="flex-1 min-w-[200px]">
              <h2 className="text-2xl font-bold text-foreground">{studentName}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {studentClassrooms?.map((sc: any) => (
                  <Badge key={sc.classroom_id} variant="secondary" className="font-normal">
                    {sc.classrooms?.name} • {sc.classrooms?.profiles?.full_name || "Teacher"}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4 flex-wrap">
              {overallGrade !== null && (
                <div className={`text-center px-4 py-2 rounded-xl ${getGradeBg(overallGrade)} backdrop-blur-sm`}>
                  <p className={`text-3xl font-bold ${getGradeColor(overallGrade)}`}>
                    {Math.round(overallGrade)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Overall Grade</p>
                </div>
              )}
              {behaviorStats && (
                <div className="text-center px-4 py-2 rounded-xl bg-primary/5 backdrop-blur-sm">
                  <p className="text-3xl font-bold text-primary">{behaviorStats.totalPoints}</p>
                  <p className="text-xs text-muted-foreground">Behavior Points</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Due Today */}
        <Card className="border-0 bg-gradient-to-br from-blue-500/[0.08] to-blue-500/[0.02] backdrop-blur-sm shadow-[var(--shadow-glass-sm)] hover:shadow-[var(--shadow-glass-md)] transition-all hover:scale-[1.02]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/15 shadow-sm">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUpcoming}</p>
                <p className="text-xs text-muted-foreground">Due Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Past Due */}
        <Card className={`border-0 backdrop-blur-sm shadow-[var(--shadow-glass-sm)] hover:shadow-[var(--shadow-glass-md)] transition-all hover:scale-[1.02] ${totalPastDue > 0 ? "bg-gradient-to-br from-red-500/[0.08] to-red-500/[0.02] ring-2 ring-destructive/20" : "bg-gradient-to-br from-muted/50 to-muted/20"}`}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl shadow-sm ${totalPastDue > 0 ? "bg-red-500/15" : "bg-muted"}`}>
                <AlertTriangle className={`h-5 w-5 ${totalPastDue > 0 ? "text-red-600" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${totalPastDue > 0 ? "text-destructive" : ""}`}>
                  {totalPastDue}
                </p>
                <p className="text-xs text-muted-foreground">Past Due</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card className="border-0 bg-gradient-to-br from-green-500/[0.08] to-green-500/[0.02] backdrop-blur-sm shadow-[var(--shadow-glass-sm)] hover:shadow-[var(--shadow-glass-md)] transition-all hover:scale-[1.02]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-500/15 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAssignmentsCompleted}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reading Sessions */}
        <Card className="border-0 bg-gradient-to-br from-purple-500/[0.08] to-purple-500/[0.02] backdrop-blur-sm shadow-[var(--shadow-glass-sm)] hover:shadow-[var(--shadow-glass-md)] transition-all hover:scale-[1.02]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/15 shadow-sm">
                <Mic className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{auraStats?.sessionsCount || 0}</p>
                <p className="text-xs text-muted-foreground">Reading Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reading Progress Card */}
      {auraStats && (
        <Card className="border-0 bg-gradient-to-br from-purple-500/5 to-primary/5 shadow-[var(--shadow-glass-md)] backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mic className="h-5 w-5 text-purple-600" />
              Reading Progress (AURA)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Words Per Minute</span>
                  <span className="font-bold">{auraStats.avgWpm}</span>
                </div>
                <Progress value={Math.min(auraStats.avgWpm, 200) / 2} className="h-2" />
                {auraStats.wpmImprovement !== 0 && (
                  <p className={`text-xs ${auraStats.wpmImprovement > 0 ? "text-green-600" : "text-red-600"}`}>
                    {auraStats.wpmImprovement > 0 ? "+" : ""}{auraStats.wpmImprovement} WPM this month
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Clarity</span>
                  <span className="font-bold">{auraStats.avgClarity}%</span>
                </div>
                <Progress value={auraStats.avgClarity} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-bold">{auraStats.avgConfidence}%</span>
                </div>
                <Progress value={auraStats.avgConfidence} className="h-2" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-3xl font-bold text-purple-600">{auraStats.sessionsCount}</p>
                <p className="text-xs text-muted-foreground">Sessions this month</p>
                {auraStats.latestSession && (
                  <p className="text-xs text-muted-foreground">
                    Last: {format(new Date(auraStats.latestSession), "MMM d")}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Classrooms Grid */}
      {gradebook && gradebook.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Classes & Grades
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {gradebook.map((classroom) => {
              const teacherName = studentClassrooms?.find(
                (sc: any) => sc.classroom_id === classroom.id
              )?.classrooms?.profiles?.full_name || "Teacher";

              return (
                <Card 
                  key={classroom.id}
                  className="border-0 bg-card/80 backdrop-blur-sm shadow-[var(--shadow-glass-sm)] hover:shadow-[var(--shadow-glass-md)] transition-all hover:scale-[1.01]"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{classroom.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{teacherName}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-lg ${getGradeBg(classroom.finalGrade || classroom.currentGrade)}`}>
                        <span className={`text-xl font-bold ${getGradeColor(classroom.finalGrade || classroom.currentGrade)}`}>
                          {classroom.finalGrade ? Math.round(classroom.finalGrade) : classroom.currentGrade ? Math.round(classroom.currentGrade) : "--"}%
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Category Breakdown */}
                    {classroom.categoryBreakdown && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <p className="font-semibold">{Math.round(classroom.categoryBreakdown.test.average)}%</p>
                          <p className="text-muted-foreground">Tests</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <p className="font-semibold">{Math.round(classroom.categoryBreakdown.quiz.average)}%</p>
                          <p className="text-muted-foreground">Quizzes</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <p className="font-semibold">{Math.round(classroom.categoryBreakdown.homework.average)}%</p>
                          <p className="text-muted-foreground">Homework</p>
                        </div>
                      </div>
                    )}

                    {/* Attendance */}
                    {classroom.totalDaysRecorded > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Attendance</span>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-0">
                            {classroom.daysPresent} Present
                          </Badge>
                          {classroom.daysTardy > 0 && (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-0">
                              {classroom.daysTardy} Tardy
                            </Badge>
                          )}
                          {classroom.daysAbsent > 0 && (
                            <Badge variant="outline" className="bg-red-500/10 text-red-700 border-0">
                              {classroom.daysAbsent} Absent
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Upcoming */}
                    {classroom.upcomingAssignments.length > 0 && (
                      <div className="text-sm">
                        <p className="text-muted-foreground mb-1">Upcoming:</p>
                        <div className="space-y-1">
                          {classroom.upcomingAssignments.slice(0, 2).map((a) => (
                            <div key={a.id} className="flex justify-between items-center text-xs bg-muted/30 rounded px-2 py-1">
                              <span className="truncate">{a.title}</span>
                              <span className="text-muted-foreground whitespace-nowrap ml-2">
                                {format(new Date(a.dueDate), "MMM d")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
