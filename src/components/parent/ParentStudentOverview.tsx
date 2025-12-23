import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  GraduationCap, 
  Clock, 
  CheckCircle2,
  AlertTriangle,
  Mic,
  Star
} from "lucide-react";
import { format } from "date-fns";
import { useStudentOverviewData } from "@/hooks/useStudentOverviewData";
import { Skeleton } from "@/components/ui/skeleton";

interface ParentStudentOverviewProps {
  studentId: string;
  studentName: string;
}

export const ParentStudentOverview = ({ studentId, studentName }: ParentStudentOverviewProps) => {
  const { data: overview, isLoading } = useStudentOverviewData(studentId);

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
    );
  }

  const behaviorStats = overview?.behaviorStats;
  const auraStats = overview?.auraStats;

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
                {overview?.classrooms.map((classroom) => (
                  <Badge key={classroom.id} variant="secondary" className="font-normal">
                    {classroom.name} • {classroom.teacherName}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4 flex-wrap">
              {overview?.overallGrade !== null && (
                <div className={`text-center px-4 py-2 rounded-xl ${getGradeBg(overview?.overallGrade ?? null)} backdrop-blur-sm`}>
                  <p className={`text-3xl font-bold ${getGradeColor(overview?.overallGrade ?? null)}`}>
                    {Math.round(overview?.overallGrade ?? 0)}%
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
                <p className="text-2xl font-bold">{overview?.dueTodayCount || 0}</p>
                <p className="text-xs text-muted-foreground">Due Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Past Due */}
        <Card className={`border-0 backdrop-blur-sm shadow-[var(--shadow-glass-sm)] hover:shadow-[var(--shadow-glass-md)] transition-all hover:scale-[1.02] ${(overview?.pastDueCount || 0) > 0 ? "bg-gradient-to-br from-red-500/[0.08] to-red-500/[0.02] ring-2 ring-destructive/20" : "bg-gradient-to-br from-muted/50 to-muted/20"}`}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl shadow-sm ${(overview?.pastDueCount || 0) > 0 ? "bg-red-500/15" : "bg-muted"}`}>
                <AlertTriangle className={`h-5 w-5 ${(overview?.pastDueCount || 0) > 0 ? "text-red-600" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${(overview?.pastDueCount || 0) > 0 ? "text-destructive" : ""}`}>
                  {overview?.pastDueCount || 0}
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
                <p className="text-2xl font-bold">{overview?.completedCount || 0}</p>
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
                <p className="text-2xl font-bold">{overview?.auraSessionCount || 0}</p>
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
                <p className="text-3xl font-bold text-purple-600">{overview?.auraSessionCount || 0}</p>
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

      {/* Classrooms Grid - Simplified */}
      {overview?.classrooms && overview.classrooms.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Classes & Grades
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {overview.classrooms.map((classroom) => (
              <Card 
                key={classroom.id}
                className="border-0 bg-card/80 backdrop-blur-sm shadow-[var(--shadow-glass-sm)] hover:shadow-[var(--shadow-glass-md)] transition-all hover:scale-[1.01]"
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{classroom.name}</h4>
                      <p className="text-sm text-muted-foreground">{classroom.teacherName}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-lg ${getGradeBg(classroom.finalGrade)}`}>
                      <span className={`text-xl font-bold ${getGradeColor(classroom.finalGrade)}`}>
                        {classroom.finalGrade ? Math.round(classroom.finalGrade) : "--"}%
                      </span>
                    </div>
                  </div>
                  {classroom.upcomingCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {classroom.upcomingCount} upcoming assignment{classroom.upcomingCount > 1 ? "s" : ""}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
