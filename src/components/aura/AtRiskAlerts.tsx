import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingDown, Clock, Target } from "lucide-react";

interface AtRiskAlertsProps {
  students: any[];
  records: any[];
  skillVectors: any[];
}

interface RiskAssessment {
  studentId: string;
  studentName: string;
  riskScore: number;
  riskLevel: "urgent" | "monitor" | "on-track";
  factors: string[];
  recommendations: string[];
}

const AtRiskAlerts = ({ students, records, skillVectors }: AtRiskAlertsProps) => {
  const calculateRiskScore = (studentId: string): RiskAssessment => {
    const studentRecords = records.filter((r) => r.profile_id === studentId);
    const vector = skillVectors.find((v) => v.student_id === studentId);
    const student = students.find((s) => s.student_id === studentId);

    let riskScore = 0;
    const factors: string[] = [];
    const recommendations: string[] = [];

    // Factor 1: No improvement in 3+ weeks (40% weight)
    if (vector?.weekly_improvement !== undefined && vector.weekly_improvement <= 0) {
      riskScore += 40;
      factors.push("No improvement in recent weeks");
      recommendations.push("Schedule 1-on-1 check-in to identify blockers");
    }

    // Factor 2: Declining trend (30% weight)
    const recentGrades = studentRecords.slice(0, 5).map((r) => r.grade || 0);
    if (recentGrades.length >= 3) {
      const isDecline = recentGrades[0] < recentGrades[2];
      if (isDecline) {
        riskScore += 30;
        factors.push("Declining performance trend");
        recommendations.push("Review confidence and motivation levels");
      }
    }

    // Factor 3: Low practice frequency (20% weight)
    const recentActivity = studentRecords.filter((r) => {
      const daysSince = (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 14;
    });
    if (recentActivity.length < 3) {
      riskScore += 20;
      factors.push("Low practice frequency (< 3 sessions in 2 weeks)");
      recommendations.push("Send practice reminder to student/parent");
    }

    // Factor 4: Multiple phoneme struggles (10% weight)
    if (vector?.phoneme_scores) {
      const strugglingPhonemes = Object.values(vector.phoneme_scores).filter(
        (score: any) => score < 70
      );
      if (strugglingPhonemes.length >= 3) {
        riskScore += 10;
        factors.push(`Struggling with ${strugglingPhonemes.length} phonemes`);
        recommendations.push("Generate targeted practice exercises");
      }
    }

    let riskLevel: "urgent" | "monitor" | "on-track" = "on-track";
    if (riskScore >= 70) riskLevel = "urgent";
    else if (riskScore >= 50) riskLevel = "monitor";

    return {
      studentId,
      studentName: student?.profiles?.full_name || "Unknown",
      riskScore,
      riskLevel,
      factors,
      recommendations,
    };
  };

  const assessments = students
    .map((s) => calculateRiskScore(s.student_id))
    .filter((a) => a.riskLevel !== "on-track")
    .sort((a, b) => b.riskScore - a.riskScore);

  const getRiskBadgeVariant = (level: string) => {
    if (level === "urgent") return "destructive";
    if (level === "monitor") return "secondary";
    return "default";
  };

  const getRiskIcon = (level: string) => {
    if (level === "urgent") return <AlertTriangle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          At-Risk Student Alerts
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Predictive analytics for early intervention
        </p>
      </CardHeader>
      <CardContent>
        {assessments.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto text-green-500 mb-2" />
            <p className="text-sm font-medium">All students on track! 🎉</p>
            <p className="text-xs text-muted-foreground mt-1">
              No students currently flagged for intervention
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map((assessment) => (
              <div
                key={assessment.studentId}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getRiskIcon(assessment.riskLevel)}
                    <span className="font-medium">{assessment.studentName}</span>
                  </div>
                  <Badge variant={getRiskBadgeVariant(assessment.riskLevel)}>
                    {assessment.riskLevel === "urgent" ? "🔴 URGENT" : "🟡 MONITOR"}
                    {" "}({assessment.riskScore})
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Risk Factors:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {assessment.factors.map((factor, i) => (
                        <li key={i} className="text-sm">{factor}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Recommended Actions:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {assessment.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-primary">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Button size="sm" variant="outline" className="w-full">
                  Mark as Addressed
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AtRiskAlerts;
