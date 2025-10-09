import { useAssignmentStats } from "@/hooks/useAssignmentStats";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface AssignmentStatsCardProps {
  assignmentId: string;
}

export const AssignmentStatsCard = ({ assignmentId }: AssignmentStatsCardProps) => {
  const { stats } = useAssignmentStats(assignmentId);

  if (stats.total === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No submissions yet
      </div>
    );
  }

  const submittedPercentage = (stats.submitted / stats.total) * 100;
  const gradedPercentage = (stats.graded / stats.total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Submissions</span>
        <span className="font-medium">
          {stats.submitted}/{stats.total}
        </span>
      </div>
      <Progress value={submittedPercentage} className="h-1" />
      
      <div className="grid grid-cols-3 gap-2 text-xs pt-1">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          <span>{stats.graded}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-blue-500" />
          <span>{stats.inProgress}</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3 text-muted-foreground" />
          <span>{stats.notStarted}</span>
        </div>
      </div>
    </div>
  );
};
