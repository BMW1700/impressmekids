import { Award, Flame, BookOpen, Target, Zap, Trophy, Calendar, Clock } from "lucide-react";
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
    gradient: "from-blue-500 to-blue-400",
    shadowColor: "rgba(59, 130, 246, 0.4)",
  },
  on_fire: {
    icon: Flame,
    label: "On Fire",
    description: "3-day reading streak",
    gradient: "from-orange-500 to-amber-400",
    shadowColor: "rgba(249, 115, 22, 0.4)",
  },
  bookworm: {
    icon: BookOpen,
    label: "Bookworm",
    description: "Read 1,000 words",
    gradient: "from-green-500 to-emerald-400",
    shadowColor: "rgba(16, 185, 129, 0.4)",
  },
  sharp_shooter: {
    icon: Target,
    label: "Sharp Shooter",
    description: "95%+ accuracy",
    gradient: "from-purple-500 to-purple-400",
    shadowColor: "rgba(139, 92, 246, 0.4)",
  },
  speed_demon: {
    icon: Zap,
    label: "Speed Demon",
    description: "Exceeded grade-level WPM",
    gradient: "from-amber-500 to-yellow-400",
    shadowColor: "rgba(245, 158, 11, 0.4)",
  },
  phoneme_master: {
    icon: Trophy,
    label: "Phoneme Master",
    description: "Mastered 10+ phonemes",
    gradient: "from-pink-500 to-rose-400",
    shadowColor: "rgba(236, 72, 153, 0.4)",
  },
  week_warrior: {
    icon: Calendar,
    label: "Week Warrior",
    description: "7-day reading streak",
    gradient: "from-indigo-500 to-indigo-400",
    shadowColor: "rgba(99, 102, 241, 0.4)",
  },
  month_master: {
    icon: Clock,
    label: "Month Master",
    description: "30-day reading streak",
    gradient: "from-red-500 to-red-400",
    shadowColor: "rgba(239, 68, 68, 0.4)",
  },
};

export const AchievementBadge = ({ achievement, size = "md" }: AchievementBadgeProps) => {
  const config = achievementConfig[achievement.achievement_type as keyof typeof achievementConfig];
  
  if (!config) return null;

  const Icon = config.icon;
  const sizeClasses = {
    sm: { container: "w-12 h-12", icon: "h-5 w-5" },
    md: { container: "w-16 h-16", icon: "h-7 w-7" },
    lg: { container: "w-20 h-20", icon: "h-10 w-10" },
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`${sizeClasses[size].container} rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center cursor-pointer hover:scale-115 transition-all duration-300 ring-3 ring-white/50`}
            style={{ boxShadow: `0 8px 24px ${config.shadowColor}` }}
          >
            <Icon className={`${sizeClasses[size].icon} text-white`} />
          </div>
        </TooltipTrigger>
        <TooltipContent className="glass-card border-0 p-3">
          <div className="text-center">
            <p className="font-bold text-sm">{config.label}</p>
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
