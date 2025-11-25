import { Award, Flame, BookOpen, Target, Zap, Trophy, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Achievement {
  achievement_type: string;
  earned_at: string;
  metadata?: Record<string, any>;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: "sm" | "md" | "lg";
}

const achievementConfig = {
  first_words: {
    icon: Award,
    label: "First Words",
    description: "Completed your first reading session",
    color: "text-blue-500",
  },
  on_fire: {
    icon: Flame,
    label: "On Fire",
    description: "3-day reading streak",
    color: "text-orange-500",
  },
  bookworm: {
    icon: BookOpen,
    label: "Bookworm",
    description: "Read 1,000 words",
    color: "text-green-500",
  },
  sharp_shooter: {
    icon: Target,
    label: "Sharp Shooter",
    description: "95%+ accuracy",
    color: "text-purple-500",
  },
  speed_demon: {
    icon: Zap,
    label: "Speed Demon",
    description: "Exceeded grade-level WPM",
    color: "text-yellow-500",
  },
  phoneme_master: {
    icon: Trophy,
    label: "Phoneme Master",
    description: "Mastered 10+ phonemes",
    color: "text-pink-500",
  },
  week_warrior: {
    icon: Calendar,
    label: "Week Warrior",
    description: "7-day reading streak",
    color: "text-indigo-500",
  },
  month_master: {
    icon: Clock,
    label: "Month Master",
    description: "30-day reading streak",
    color: "text-red-500",
  },
};

export const AchievementBadge = ({ achievement, size = "md" }: AchievementBadgeProps) => {
  const config = achievementConfig[achievement.achievement_type as keyof typeof achievementConfig];
  
  if (!config) return null;

  const Icon = config.icon;
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="cursor-pointer hover:scale-110 transition-transform p-2"
          >
            <Icon className={`${sizeClasses[size]} ${config.color}`} />
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-semibold">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Earned: {new Date(achievement.earned_at).toLocaleDateString()}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
