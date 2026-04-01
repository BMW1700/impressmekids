import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ipaToEnglishWithSlashes } from "@/lib/phonemeDisplayUtils";

interface PracticeExerciseCardProps {
  exercise: {
    id: string;
    exercise_type: string;
    content: string;
    phoneme_targets: string[];
    completed: boolean;
    effectiveness_score: number | null;
  };
  onComplete?: () => void;
}

const PracticeExerciseCard = ({ exercise, onComplete }: PracticeExerciseCardProps) => {
  const { toast } = useToast();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tongue_twister": return "🌀";
      case "read_aloud": return "📖";
      case "creative": return "💡";
      default: return "✨";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "tongue_twister": return "Tongue Twister";
      case "read_aloud": return "Read Aloud";
      case "creative": return "Creative Speaking";
      default: return type;
    }
  };

  const handleMarkComplete = async () => {
    try {
      const { error } = await supabase
        .from("practice_exercises")
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq("id", exercise.id);

      if (error) throw error;

      toast({
        title: "Exercise Completed! 🎉",
        description: "Great job! Keep practicing to improve.",
      });

      onComplete?.();
    } catch (error) {
      console.error("Error completing exercise:", error);
      toast({
        title: "Error",
        description: "Failed to mark exercise as complete",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={exercise.completed ? "opacity-60" : ""}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getTypeIcon(exercise.exercise_type)}</span>
              <div>
                <p className="font-medium">{getTypeLabel(exercise.exercise_type)}</p>
                <div className="flex gap-1 mt-1">
                  {exercise.phoneme_targets.map((phoneme) => (
                    <Badge key={phoneme} variant="secondary" className="text-xs">
                      {phoneme}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            {exercise.completed && (
              <Badge variant="default" className="gap-1">
                <Check className="w-3 h-3" />
                Done
              </Badge>
            )}
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm leading-relaxed">{exercise.content}</p>
          </div>

          {exercise.effectiveness_score !== null && (
            <div className="flex items-center gap-2 text-xs">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-muted-foreground">
                Effectiveness: <strong>{exercise.effectiveness_score}%</strong>
              </span>
            </div>
          )}

          {!exercise.completed && (
            <Button onClick={handleMarkComplete} className="w-full">
              Mark as Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PracticeExerciseCard;
