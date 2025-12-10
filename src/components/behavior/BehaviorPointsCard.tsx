import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, Flame } from "lucide-react";
import { useStudentBehaviorStats } from "@/hooks/useBehaviorStats";

interface BehaviorPointsCardProps {
  studentId: string;
  classroomId: string;
}

export const BehaviorPointsCard = ({ studentId, classroomId }: BehaviorPointsCardProps) => {
  const { data: stats } = useStudentBehaviorStats(studentId, classroomId);

  return (
    <Card variant="glass" className="hover-lift relative overflow-hidden">
      {/* Purple gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 pointer-events-none" />
      
      {/* Purple accent top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
      
      <CardHeader className="relative pb-2 pt-5">
        <CardTitle className="flex items-center gap-3">
          <div className="icon-circle-purple">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <span>Behavior Points</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative space-y-4">
        <div className="text-center py-2">
          <p className="text-6xl font-black text-gradient-purple">
            {stats?.total_points || 0}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Total Points</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-3">
            <div className="icon-circle-green w-10 h-10">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">This Week</p>
              <p className="text-xl font-bold">{stats?.weekly_points || 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="icon-circle-orange w-10 h-10">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Streak</p>
              <p className="text-xl font-bold">{stats?.current_streak || 0} days</p>
            </div>
          </div>
        </div>

        {stats?.best_streak && stats.best_streak > 0 && (
          <div className="pt-3 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              Best Streak: <span className="font-bold text-foreground">{stats.best_streak} days</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
