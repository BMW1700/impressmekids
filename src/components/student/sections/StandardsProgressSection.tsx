import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useStudentStandardScores } from "@/hooks/useStudentStandardScores";
import { Trophy, TrendingUp, Target } from "lucide-react";

interface StandardsProgressSectionProps {
  studentId: string;
  classroomId: string;
}

export const StandardsProgressSection = ({
  studentId,
  classroomId,
}: StandardsProgressSectionProps) => {
  const { data: scores, isLoading } = useStudentStandardScores(studentId, classroomId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Your Standards Progress...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!scores || scores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Common Core Standards Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Complete assignments to see your progress on Common Core standards!
          </p>
        </CardContent>
      </Card>
    );
  }

  const getMasteryLevel = (mastery: number) => {
    if (mastery >= 80) return { label: "Mastered", color: "default", icon: Trophy };
    if (mastery >= 60) return { label: "Developing", color: "secondary", icon: TrendingUp };
    return { label: "Needs Practice", color: "destructive", icon: Target };
  };

  const masteredCount = scores.filter((s) => s.mastery_percentage >= 80).length;
  const totalCount = scores.length;

  // Group by subject
  const scoresBySubject = scores.reduce((acc, score) => {
    const subject = score.learning_standards?.subject || "Other";
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(score);
    return acc;
  }, {} as Record<string, typeof scores>);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Your Standards Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-2 mb-6">
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {masteredCount} / {totalCount}
            </div>
            <p className="text-sm text-muted-foreground">
              Standards Mastered (80%+)
            </p>
            <Progress value={(masteredCount / totalCount) * 100} className="h-2" />
          </div>

          <div className="space-y-6">
            {Object.entries(scoresBySubject).map(([subject, subjectScores]) => (
              <div key={subject} className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  {subject}
                  <Badge variant="outline">
                    {subjectScores.length} standard{subjectScores.length > 1 ? "s" : ""}
                  </Badge>
                </h3>

                <div className="space-y-3">
                  {subjectScores
                    .sort((a, b) => b.mastery_percentage - a.mastery_percentage)
                    .map((score) => {
                      const level = getMasteryLevel(score.mastery_percentage);
                      const Icon = level.icon;

                      return (
                        <div
                          key={score.id}
                          className="p-4 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {score.learning_standards?.code}
                                </Badge>
                                <Badge variant={level.color as any}>
                                  <Icon className="h-3 w-3 mr-1" />
                                  {level.label}
                                </Badge>
                              </div>
                              <p className="text-sm">
                                {score.learning_standards?.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {score.assignments_completed} assignment
                                {score.assignments_completed !== 1 ? "s" : ""} completed
                              </p>
                            </div>
                            <div className="text-2xl font-bold">
                              {score.mastery_percentage.toFixed(0)}%
                            </div>
                          </div>

                          <Progress value={score.mastery_percentage} className="h-2" />
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
