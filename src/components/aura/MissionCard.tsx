import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, Users, TrendingUp, CheckCircle } from "lucide-react";

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

const missionConfig = {
  daily_reading: {
    icon: Clock,
    gradient: "from-purple-500 to-purple-400",
    progressGradient: "purple" as const,
    accentColor: "border-l-purple-500",
  },
  weekly_wpm: {
    icon: TrendingUp,
    gradient: "from-blue-500 to-blue-400",
    progressGradient: "blue" as const,
    accentColor: "border-l-blue-500",
  },
  class_challenge: {
    icon: Users,
    gradient: "from-green-500 to-green-400",
    progressGradient: "green" as const,
    accentColor: "border-l-green-500",
  },
  accuracy_goal: {
    icon: Target,
    gradient: "from-orange-500 to-orange-400",
    progressGradient: "orange" as const,
    accentColor: "border-l-orange-500",
  },
};

export const MissionCard = ({ mission }: MissionCardProps) => {
  const config = missionConfig[mission.mission_type as keyof typeof missionConfig] || missionConfig.daily_reading;
  const Icon = config.icon;
  const progress = (mission.current_value / mission.target_value) * 100;
  const isCompleted = mission.status === 'completed';
  const isExpired = mission.status === 'expired';

  return (
    <Card 
      variant="glass" 
      className={`hover-lift relative overflow-hidden border-l-4 ${config.accentColor} ${
        isCompleted ? 'ring-2 ring-green-500/50' : isExpired ? 'opacity-60' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}
              style={{ boxShadow: `0 8px 20px ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(139, 92, 246, 0.3)'}` }}
            >
              {isCompleted ? (
                <CheckCircle className="h-6 w-6 text-white" />
              ) : (
                <Icon className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg font-bold">{mission.title}</CardTitle>
              <CardDescription className="text-sm">{mission.description}</CardDescription>
            </div>
          </div>
          {isCompleted && (
            <Badge variant="green" className="shadow-glow-green">
              ✓ Complete
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-medium">Progress</span>
          <span className="text-2xl font-black">
            {mission.current_value} <span className="text-base text-muted-foreground font-medium">/ {mission.target_value}</span>
          </span>
        </div>
        
        <Progress 
          value={progress} 
          variant="premium" 
          gradient={isCompleted ? "green" : config.progressGradient} 
          className="h-3" 
        />
        
        {mission.expires_at && !isCompleted && (
          <p className="text-xs text-muted-foreground">
            Expires: {new Date(mission.expires_at).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
