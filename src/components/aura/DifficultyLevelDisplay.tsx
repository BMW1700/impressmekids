import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, Target } from "lucide-react";

interface DifficultyLevelDisplayProps {
  currentLevel: number;
  recommendedLevel: number;
  confidence: number;
  reasoning: string;
}

export const DifficultyLevelDisplay = ({
  currentLevel,
  recommendedLevel,
  confidence,
  reasoning,
}: DifficultyLevelDisplayProps) => {
  const levelLabels = ["Beginner", "Elementary", "Intermediate", "Advanced", "Expert"];
  const currentLabel = levelLabels[currentLevel - 1] || "Unknown";
  const recommendedLabel = levelLabels[recommendedLevel - 1] || "Unknown";

  const shouldLevelUp = recommendedLevel > currentLevel;
  const isOptimal = recommendedLevel === currentLevel;

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5 mb-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Your Level</span>
          </div>
          <Badge variant={isOptimal ? "default" : "secondary"}>
            {currentLabel}
          </Badge>
        </div>

        {!isOptimal && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5">
            {shouldLevelUp ? (
              <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
            ) : (
              <Target className="w-4 h-4 text-amber-500 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-xs font-medium">
                {shouldLevelUp ? "Ready to Level Up!" : "Adjusting Difficulty"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: <span className="font-semibold">{recommendedLabel}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">{reasoning}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">AI Confidence:</span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
          <span className="font-medium">{Math.round(confidence * 100)}%</span>
        </div>
      </div>
    </Card>
  );
};
