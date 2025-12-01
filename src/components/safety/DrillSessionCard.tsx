import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Clock, Users } from "lucide-react";

interface DrillSessionCardProps {
  drill: any;
}

export function DrillSessionCard({ drill }: DrillSessionCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-red-500";
      case "completed": return "bg-green-500";
      case "scheduled": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getDrillTypeIcon = (type: string) => {
    return <Shield className="h-5 w-5" />;
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="p-3 bg-primary/10 rounded-lg">
            {getDrillTypeIcon(drill.drill_type)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold capitalize">
                {drill.drill_type.replace(/_/g, " ")} Drill
              </h3>
              <Badge className={getStatusColor(drill.status)}>
                {drill.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {drill.started_at 
                    ? new Date(drill.started_at).toLocaleString()
                    : "Not started"}
                </span>
              </div>
              {drill.ended_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Ended {new Date(drill.ended_at).toLocaleString()}</span>
                </div>
              )}
            </div>

            {drill.notes && (
              <p className="text-sm text-muted-foreground">{drill.notes}</p>
            )}
          </div>
        </div>

        {drill.status === "active" && (
          <Button size="sm">
            Monitor Live
          </Button>
        )}
      </div>
    </Card>
  );
}
