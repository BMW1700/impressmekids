import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useClassroomStandardScores } from "@/hooks/useStudentStandardScores";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StandardsProgressDashboardProps {
  classroomId: string;
}

export const StandardsProgressDashboard = ({
  classroomId,
}: StandardsProgressDashboardProps) => {
  const { data: scores, isLoading } = useClassroomStandardScores(classroomId);

  const aggregatedData = useMemo(() => {
    if (!scores) return [];

    const standardsMap = new Map();

    scores.forEach((score) => {
      const standard = score.learning_standards;
      if (!standard) return;

      if (!standardsMap.has(standard.id)) {
        standardsMap.set(standard.id, {
          standard,
          students: [],
          avgMastery: 0,
        });
      }

      standardsMap.get(standard.id).students.push({
        name: score.profiles?.full_name || "Unknown",
        mastery: score.mastery_percentage,
      });
    });

    const result = Array.from(standardsMap.values()).map((item) => {
      const avgMastery =
        item.students.reduce((sum: number, s: any) => sum + s.mastery, 0) /
        item.students.length;

      const atRiskCount = item.students.filter((s: any) => s.mastery < 60).length;
      const proficientCount = item.students.filter((s: any) => s.mastery >= 80).length;

      return {
        ...item,
        avgMastery,
        atRiskCount,
        proficientCount,
        totalStudents: item.students.length,
      };
    });

    return result.sort((a, b) => a.avgMastery - b.avgMastery);
  }, [scores]);

  const getMasteryColor = (mastery: number) => {
    if (mastery < 60) return "destructive";
    if (mastery < 80) return "secondary";
    return "default";
  };

  const getMasteryIcon = (mastery: number) => {
    if (mastery < 60) return <TrendingDown className="h-4 w-4" />;
    if (mastery < 80) return <Minus className="h-4 w-4" />;
    return <TrendingUp className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Standards Progress...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!aggregatedData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Standards Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No graded assignments with standards mapped yet. Create assignments and
            map them to Common Core standards to see progress here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Common Core Standards Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {aggregatedData.map((item) => (
          <div
            key={item.standard.id}
            className="p-4 border rounded-lg space-y-3 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="font-mono text-xs">
                    {item.standard.code}
                  </Badge>
                  <Badge variant={getMasteryColor(item.avgMastery)}>
                    {item.avgMastery.toFixed(0)}% Class Average
                  </Badge>
                </div>
                <p className="text-sm font-medium">{item.standard.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.standard.subject} • {item.standard.category}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getMasteryIcon(item.avgMastery)}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-destructive">
                  {item.atRiskCount}
                </span>{" "}
                at risk (&lt;60%)
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-green-600">
                  {item.proficientCount}
                </span>{" "}
                proficient (≥80%)
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold">{item.totalStudents}</span> total
                students
              </div>
            </div>

            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all"
                style={{ width: `${item.avgMastery}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
