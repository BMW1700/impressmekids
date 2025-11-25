import { Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  showDetails?: boolean;
}

export const StreakCounter = ({ currentStreak, longestStreak, showDetails = true }: StreakCounterProps) => {
  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-red-500";
    if (streak >= 7) return "text-orange-500";
    if (streak >= 3) return "text-yellow-500";
    return "text-muted-foreground";
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return "Start your streak today!";
    if (streak === 1) return "Great start! Keep it up!";
    if (streak >= 3 && streak < 7) return "You're on fire! 🔥";
    if (streak >= 7 && streak < 30) return "Incredible streak! Keep going!";
    if (streak >= 30) return "Legendary! You're unstoppable!";
    return "Keep reading!";
  };

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2">
        <Flame className={`h-5 w-5 ${getStreakColor(currentStreak)} ${currentStreak > 0 ? 'animate-pulse' : ''}`} />
        <span className="font-bold text-lg">{currentStreak}</span>
      </div>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Flame className={`h-8 w-8 ${getStreakColor(currentStreak)} ${currentStreak > 0 ? 'animate-pulse' : ''}`} />
          <div>
            <p className="text-2xl font-bold">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">day streak</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          Best: {longestStreak} days
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{getStreakMessage(currentStreak)}</p>
    </Card>
  );
};
