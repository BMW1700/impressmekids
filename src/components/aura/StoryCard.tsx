import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Star } from "lucide-react";
import { motion } from "framer-motion";

interface StoryCardProps {
  title: string;
  description: string;
  grade_level: number;
  category: string;
  word_count: number;
  reading_time_minutes: number;
  difficulty_level: number;
  cover_gradient: string;
  completed?: boolean;
  best_wpm?: number;
  times_read?: number;
  onStartReading: () => void;
}

const categoryIcons: Record<string, string> = {
  animals: "🐾",
  space: "🚀",
  sports: "⚽",
  fairy_tales: "✨",
  science: "🔬",
  adventure: "🗺️",
  history: "📜"
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    animals: "from-amber-400/20 to-orange-500/20",
    space: "from-indigo-400/20 to-purple-500/20",
    sports: "from-green-400/20 to-emerald-500/20",
    fairy_tales: "from-pink-400/20 to-rose-500/20",
    science: "from-cyan-400/20 to-blue-500/20",
    adventure: "from-yellow-400/20 to-amber-500/20",
    history: "from-stone-400/20 to-neutral-500/20"
  };
  return colors[category] || "from-gray-400/20 to-slate-500/20";
};

export const StoryCard = ({
  title,
  description,
  grade_level,
  category,
  word_count,
  reading_time_minutes,
  difficulty_level,
  cover_gradient,
  completed = false,
  best_wpm,
  times_read = 0,
  onStartReading
}: StoryCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`overflow-hidden cursor-pointer transition-all ${completed ? 'ring-2 ring-yellow-500' : ''}`}>
        {/* Cover Art */}
        <div className={`h-40 bg-gradient-to-br ${cover_gradient} relative`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(category)} backdrop-blur-sm`} />
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-white/90 text-xs">
              Grade {grade_level === 0 ? 'K' : grade_level}
            </Badge>
          </div>
          {completed && (
            <div className="absolute top-3 left-3">
              <div className="bg-yellow-500 text-white rounded-full p-2">
                <Star className="h-4 w-4 fill-current" />
              </div>
            </div>
          )}
          <div className="absolute bottom-3 left-3 text-4xl">
            {categoryIcons[category]}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-heading text-lg font-bold mb-1 line-clamp-1">{title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {word_count} words
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {reading_time_minutes} min
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < difficulty_level ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`}
                />
              ))}
            </div>
          </div>

          {/* Progress Info */}
          {times_read > 0 && (
            <div className="text-xs text-muted-foreground">
              Read {times_read} {times_read === 1 ? 'time' : 'times'}
              {best_wpm && ` • Best: ${best_wpm} WPM`}
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={onStartReading}
            className="w-full"
            variant={completed ? "outline" : "default"}
          >
            {completed ? 'Read Again' : 'Start Reading'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
