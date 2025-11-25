import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, Users, TrendingUp } from "lucide-react";

interface Mission {
  id: string;
  mission_type: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  status: string;
  expires_at?: string;
}

interface MissionCardProps {
  mission: Mission;
}

const missionIcons = {
  daily_reading: Clock,
  weekly_wpm: TrendingUp,
  class_challenge: Users,
  accuracy_goal: Target,
};

export const MissionCard = ({ mission }: MissionCardProps) => {
  const Icon = missionIcons[mission.mission_type as keyof typeof missionIcons] || Target;
  const progress = (mission.current_value / mission.target_value) * 100;
  const isCompleted = mission.status === 'completed';
  const isExpired = mission.status === 'expired';

  const getStatusColor = () => {
    if (isCompleted) return "bg-green-500";
    if (isExpired) return "bg-muted";
    if (progress >= 75) return "bg-yellow-500";
    return "bg-primary";
  };

  return (
    <Card className={isCompleted ? "border-green-500" : isExpired ? "opacity-50" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-primary/10'}`}>
              <Icon className={`h-5 w-5 ${isCompleted ? 'text-green-600' : 'text-primary'}`} />
            </div>
            <div>
              <CardTitle className="text-base">{mission.title}</CardTitle>
              <CardDescription className="text-xs">{mission.description}</CardDescription>
            </div>
          </div>
          {isCompleted && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              ✓ Complete
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">
              {mission.current_value} / {mission.target_value}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          {mission.expires_at && !isCompleted && (
            <p className="text-xs text-muted-foreground">
              Expires: {new Date(mission.expires_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
