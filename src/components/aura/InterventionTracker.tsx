import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useInterventions } from "@/hooks/useInterventions";
import { useState } from "react";
import { CheckCircle, Clock, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface InterventionTrackerProps {
  studentId: string;
  studentName: string;
  classroomId: string;
  currentRiskScore: number;
}

const InterventionTracker = ({
  studentId,
  studentName,
  classroomId,
  currentRiskScore,
}: InterventionTrackerProps) => {
  const { interventions, isLoading, createIntervention, resolveIntervention } = useInterventions(
    studentId,
    classroomId
  );
  const [isOpen, setIsOpen] = useState(false);
  const [interventionType, setInterventionType] = useState("");
  const [notes, setNotes] = useState("");
  const [resolveScore, setResolveScore] = useState("");

  const handleCreate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    createIntervention({
      student_id: studentId,
      classroom_id: classroomId,
      teacher_id: user.id,
      intervention_type: interventionType,
      notes,
      risk_score_before: currentRiskScore,
    });

    setInterventionType("");
    setNotes("");
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const activeInterventions = interventions.filter((i) => i.status === "active");
  const resolvedInterventions = interventions.filter((i) => i.status === "resolved");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Interventions - {studentName}</span>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Intervention
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Intervention</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="type">Intervention Type</Label>
                  <Input
                    id="type"
                    placeholder="e.g., Extra practice time, One-on-one tutoring"
                    value={interventionType}
                    onChange={(e) => setInterventionType(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Describe the intervention plan..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button onClick={handleCreate} className="w-full">
                  Create Intervention
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeInterventions.length === 0 && resolvedInterventions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No interventions recorded yet. Click "New Intervention" to start tracking.
          </p>
        ) : (
          <div className="space-y-6">
            {activeInterventions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Active Interventions ({activeInterventions.length})
                </h4>
                <div className="space-y-3">
                  {activeInterventions.map((intervention) => (
                    <div
                      key={intervention.id}
                      className="p-4 border rounded-lg bg-muted/50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{intervention.intervention_type}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {intervention.notes}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Started: {new Date(intervention.created_at).toLocaleDateString()} • Risk
                            Score: {intervention.risk_score_before}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const score = prompt("Enter current risk score:");
                            if (score) {
                              resolveIntervention({
                                id: intervention.id,
                                risk_score_after: parseInt(score),
                              });
                            }
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Resolve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resolvedInterventions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Resolved Interventions ({resolvedInterventions.length})
                </h4>
                <div className="space-y-3">
                  {resolvedInterventions.slice(0, 3).map((intervention) => {
                    const improvement =
                      intervention.risk_score_before - (intervention.risk_score_after || 0);
                    return (
                      <div
                        key={intervention.id}
                        className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{intervention.intervention_type}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {intervention.notes}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="outline" className="text-xs">
                                Before: {intervention.risk_score_before}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                After: {intervention.risk_score_after || "N/A"}
                              </Badge>
                              {improvement > 0 && (
                                <Badge className="text-xs bg-green-600">
                                  Improved by {improvement} points
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InterventionTracker;
