import { Card } from "@/components/ui/card";
import { Trophy, TrendingUp, Flame } from "lucide-react";
import { useStudentBehaviorStats } from "@/hooks/useBehaviorStats";

interface BehaviorPointsCardProps {
  studentId: string;
  classroomId: string;
}

export const BehaviorPointsCard = ({ studentId, classroomId }: BehaviorPointsCardProps) => {
  const { data: stats } = useStudentBehaviorStats(studentId, classroomId);

  if (!stats) {
    return (
      <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-200/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-purple-500/20">
            <Trophy className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Behavior Points</h3>
            <p className="text-2xl font-bold text-purple-600">0</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-200/20">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-purple-500/20">
            <Trophy className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Behavior Points</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.total_points}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">This Week</p>
              <p className="text-lg font-semibold text-foreground">{stats.weekly_points}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-xs text-muted-foreground">Current Streak</p>
              <p className="text-lg font-semibold text-foreground">{stats.current_streak} days</p>
            </div>
          </div>
        </div>

        {stats.best_streak > 0 && (
          <div className="pt-2 border-t border-purple-200/20">
            <p className="text-sm text-muted-foreground">
              Best Streak: <span className="font-semibold text-foreground">{stats.best_streak} days</span>
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
