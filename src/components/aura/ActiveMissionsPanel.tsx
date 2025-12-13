import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Clock, CheckCircle, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ActiveMissionsPanelProps {
  studentId: string;
}

export const ActiveMissionsPanel = ({ studentId }: ActiveMissionsPanelProps) => {
  const { data: missions, isLoading } = useQuery({
    queryKey: ['active-missions', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_missions')
        .select('*')
        .eq('student_id', studentId)
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });

  if (isLoading) {
    return (
      <Card variant="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            Active Missions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!missions || missions.length === 0) {
    return (
      <Card variant="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            Active Missions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Start reading to unlock daily missions!
          </p>
        </CardContent>
      </Card>
    );
  }

  const getMissionIcon = (type: string) => {
    switch (type) {
      case 'daily_reading': return Clock;
      case 'weekly_wpm': return Zap;
      default: return Target;
    }
  };

  const getMissionColor = (type: string, isComplete: boolean) => {
    if (isComplete) return 'from-green-500 to-emerald-500';
    switch (type) {
      case 'daily_reading': return 'from-purple-500 to-pink-500';
      case 'weekly_wpm': return 'from-blue-500 to-cyan-500';
      default: return 'from-orange-500 to-amber-500';
    }
  };

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-500" />
          Active Missions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {missions.map((mission) => {
          const isComplete = mission.status === 'completed';
          const progress = Math.min(100, (mission.current_value / mission.target_value) * 100);
          const Icon = isComplete ? CheckCircle : getMissionIcon(mission.mission_type);
          const gradientColor = getMissionColor(mission.mission_type, isComplete);

          return (
            <div 
              key={mission.id} 
              className={`p-3 rounded-xl border transition-all ${
                isComplete 
                  ? 'bg-green-500/5 border-green-500/20' 
                  : 'bg-muted/30 border-border/50 hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradientColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm truncate">{mission.title}</p>
                    {isComplete && (
                      <Badge variant="green" className="text-xs">Done!</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={progress} 
                      className="h-2 flex-1" 
                      variant="premium"
                      gradient={isComplete ? "green" : "purple"}
                    />
                    <span className="text-xs text-muted-foreground font-medium">
                      {mission.current_value}/{mission.target_value}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};