import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  showDetails?: boolean;
}

export const StreakCounter = ({ currentStreak, longestStreak, showDetails = true }: StreakCounterProps) => {
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
        <div className="icon-circle-orange w-10 h-10">
          <Flame className="h-5 w-5 text-white" />
        </div>
        <span className="font-black text-2xl">{currentStreak}</span>
      </div>
    );
  }

  return (
    <Card variant="glass" className="hover-lift relative overflow-hidden">
      {/* Orange accent top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-400" />
      
      <CardHeader className="pb-2 pt-5">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="h-5 w-5 text-orange-500" />
          Reading Streak 🔥
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black text-gradient-orange">{currentStreak}</span>
            <span className="text-lg text-muted-foreground font-medium">day streak</span>
          </div>
          <div className="icon-circle-orange">
            <Flame className={`h-6 w-6 text-white ${currentStreak > 0 ? 'animate-pulse' : ''}`} />
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">{getStreakMessage(currentStreak)}</p>
        
        <div className="pt-2 border-t border-border/50">
          <Badge variant="orange" className="text-xs">
            Best: {longestStreak} days
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
