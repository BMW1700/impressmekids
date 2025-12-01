import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface UnaccountedChildAlertProps {
  studentName: string;
  drillType: string;
  onAcknowledge: () => void;
}

export function UnaccountedChildAlert({
  studentName,
  drillType,
  onAcknowledge
}: UnaccountedChildAlertProps) {
  return (
    <Card className="p-6 border-red-500 border-2 bg-red-500/10 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-red-500 rounded-full">
          <AlertTriangle className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-red-700 mb-2">
            URGENT: Child Unaccounted For
          </h3>
          <p className="text-lg font-semibold mb-2">
            {studentName} is currently unaccounted for during {drillType.replace(/_/g, " ")} drill
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            School staff are actively locating your child. You will be notified immediately when they are found.
          </p>
          <div className="flex gap-3">
            <Button onClick={onAcknowledge} variant="destructive">
              I Acknowledge This Alert
            </Button>
            <Button variant="outline">
              Contact School Office
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
