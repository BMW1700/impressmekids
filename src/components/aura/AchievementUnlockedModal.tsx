import { Award, Flame, BookOpen, Target, Zap, Trophy, Calendar, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface AchievementUnlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: string[];
}

const achievementConfig = {
  first_words: {
    icon: Award,
    label: "First Words",
    description: "Completed your first reading session",
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  on_fire: {
    icon: Flame,
    label: "On Fire",
    description: "3-day reading streak",
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  bookworm: {
    icon: BookOpen,
    label: "Bookworm",
    description: "Read 1,000 words",
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  sharp_shooter: {
    icon: Target,
    label: "Sharp Shooter",
    description: "95%+ accuracy",
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  speed_demon: {
    icon: Zap,
    label: "Speed Demon",
    description: "Exceeded grade-level WPM",
    color: "text-yellow-500",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  phoneme_master: {
    icon: Trophy,
    label: "Phoneme Master",
    description: "Mastered 10+ phonemes",
    color: "text-pink-500",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
  },
  week_warrior: {
    icon: Calendar,
    label: "Week Warrior",
    description: "7-day reading streak",
    color: "text-indigo-500",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
  },
  month_master: {
    icon: Clock,
    label: "Month Master",
    description: "30-day reading streak",
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
};

export const AchievementUnlockedModal = ({
  isOpen,
  onClose,
  achievements,
}: AchievementUnlockedModalProps) => {
  if (achievements.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            🎉 Achievement Unlocked! 🎉
          </DialogTitle>
          <DialogDescription className="text-center">
            You've earned {achievements.length === 1 ? 'a new badge' : 'new badges'}!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {achievements.map((achievementType) => {
            const config = achievementConfig[achievementType as keyof typeof achievementConfig];
            if (!config) return null;

            const Icon = config.icon;

            return (
              <div
                key={achievementType}
                className={`${config.bgColor} rounded-lg p-4 border-2 border-border animate-in zoom-in-50 duration-300`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full bg-background`}>
                    <Icon className={`h-8 w-8 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{config.label}</h3>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">NEW</Badge>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors"
        >
          Awesome!
        </button>
      </DialogContent>
    </Dialog>
  );
};
