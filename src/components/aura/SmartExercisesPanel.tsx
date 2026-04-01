import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Target, Sparkles } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ipaToEnglishWithSlashes } from "@/lib/phonemeDisplayUtils";

interface Exercise {
  type: string;
  content: string;
  phoneme_targets: string[];
  difficulty_level: number;
}

interface SmartExercisesPanelProps {
  exercises: Exercise[];
  onStartExercise: (exercise: Exercise) => void;
}

export const SmartExercisesPanel = ({ exercises, onStartExercise }: SmartExercisesPanelProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!exercises || exercises.length === 0) return null;

  const getIcon = (type: string) => {
    if (type === "tongue_twister") return <BookOpen className="w-4 h-4 text-amber-500" />;
    if (type === "phoneme_drill") return <Target className="w-4 h-4 text-blue-500" />;
    return <Sparkles className="w-4 h-4 text-purple-500" />;
  };

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-sm">AI-Generated Exercises</h3>
        <Badge variant="secondary" className="ml-auto">
          {exercises.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {exercises.map((exercise, index) => (
          <Card
            key={index}
            className="p-3 cursor-pointer hover:bg-primary/5 transition-colors"
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
          >
            <div className="flex items-start gap-3">
              {getIcon(exercise.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium capitalize">
                    {exercise.type.replace("_", " ")}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Level {exercise.difficulty_level}
                  </Badge>
                </div>

                <AnimatePresence>
                  {expandedIndex === index ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <p className="text-sm text-muted-foreground">{exercise.content}</p>
                      {exercise.phoneme_targets.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {exercise.phoneme_targets.map((phoneme, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              /{phoneme}/
                            </Badge>
                          ))}
                        </div>
                      )}
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartExercise(exercise);
                        }}
                        className="w-full mt-2"
                      >
                        Practice Now
                      </Button>
                    </motion.div>
                  ) : (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {exercise.content}
                    </p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};
