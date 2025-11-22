import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingDown, Clock, Target, Mail, LineChart } from "lucide-react";
import { calculateRiskScore, extractFeatures, generateRiskFactors } from "@/lib/ml/riskScoringML";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import RiskTrendChart from "./RiskTrendChart";
import InterventionTracker from "./InterventionTracker";
import { supabase } from "@/integrations/supabase/client";

interface AtRiskAlertsProps {
  students: any[];
  records: any[];
  skillVectors: any[];
  classroomId: string;
  classroomName: string;
}

interface RiskAssessment {
  studentId: string;
  studentName: string;
  riskScore: number;
  riskLevel: "urgent" | "monitor" | "on-track";
  factors: string[];
  recommendations: string[];
}

const AtRiskAlerts = ({ students, records, skillVectors, classroomId, classroomName }: AtRiskAlertsProps) => {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isSendingAlerts, setIsSendingAlerts] = useState(false);
  const assessRisk = (studentId: string): RiskAssessment => {
    const studentRecords = records.filter((r) => r.profile_id === studentId);
    const vector = skillVectors.find((v) => v.student_id === studentId);
    const student = students.find((s) => s.student_id === studentId);

    // Extract ML features
    const features = extractFeatures(studentRecords, vector, student?.profiles);
    
    // Calculate ML-based risk score
    const riskScore = calculateRiskScore(features);
    
    // Generate specific factors and recommendations
    const { factors, recommendations } = generateRiskFactors(features, riskScore);

    // Determine risk level with adaptive thresholds
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
    .map((s) => assessRisk(s.student_id))
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

  const handleSendAlerts = async (sendToParents: boolean = false) => {
    setIsSendingAlerts(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: teacher } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      const alerts = assessments.map((assessment) => ({
        studentId: assessment.studentId,
        studentName: assessment.studentName,
        teacherId: user.id,
        teacherEmail: teacher?.email || "",
        teacherName: teacher?.full_name || "",
        riskScore: assessment.riskScore,
        riskLevel: assessment.riskLevel,
        factors: assessment.factors,
        recommendations: assessment.recommendations,
        classroomId,
        classroomName,
      }));

      const response = await supabase.functions.invoke("send-risk-alerts", {
        body: { alerts, sendToParents },
      });

      if (response.error) throw response.error;

      toast({
        title: "Alerts Sent!",
        description: `Successfully sent ${alerts.length} risk alert${alerts.length > 1 ? "s" : ""}${sendToParents ? " to teachers and parents" : " to teachers"}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSendingAlerts(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              At-Risk Student Alerts
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Predictive analytics for early intervention
            </p>
          </div>
          {assessments.length > 0 && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleSendAlerts(false)}
                disabled={isSendingAlerts}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Teachers
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleSendAlerts(true)}
                disabled={isSendingAlerts}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Teachers & Parents
              </Button>
            </div>
          )}
        </div>
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

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedStudent(assessment.studentId)}
                  >
                    <LineChart className="w-4 h-4 mr-2" />
                    View Trends
                  </Button>
                </div>

                {selectedStudent === assessment.studentId && (
                  <div className="mt-4 space-y-4">
                    <RiskTrendChart
                      studentId={assessment.studentId}
                      studentName={assessment.studentName}
                    />
                    <InterventionTracker
                      studentId={assessment.studentId}
                      studentName={assessment.studentName}
                      classroomId={classroomId}
                      currentRiskScore={assessment.riskScore}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AtRiskAlerts;
