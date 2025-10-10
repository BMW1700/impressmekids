/**
 * Visualization for PATENTABLE ALGORITHM #4: Adaptive Highlight Quality Scoring
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp } from "lucide-react";
import { AdaptiveScore, PassageComplexity } from "@/lib/ml/adaptiveHighlightScoringML";

interface AdaptiveScoringDisplayProps {
  adaptiveScore: AdaptiveScore;
  passageComplexity: PassageComplexity;
}

export function AdaptiveScoringDisplay({
  adaptiveScore,
  passageComplexity,
}: AdaptiveScoringDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Adaptive Quality Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scores */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Raw Score</div>
            <div className="text-3xl font-bold">{adaptiveScore.rawScore}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Adjusted Score</div>
            <div className="text-3xl font-bold text-primary">
              {adaptiveScore.adjustedScore}
            </div>
          </div>
        </div>

        {/* Growth Factor */}
        {adaptiveScore.growthFactor !== 0 && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Growth</span>
            </div>
            <Badge 
              variant={adaptiveScore.growthFactor > 0 ? "default" : "secondary"}
              className={adaptiveScore.growthFactor > 0 ? "bg-green-500" : ""}
            >
              {adaptiveScore.growthFactor > 0 ? '+' : ''}{adaptiveScore.growthFactor}%
            </Badge>
          </div>
        )}

        {/* Passage Complexity */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Passage Complexity Adjustment
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="p-2 bg-background rounded border">
              <div className="text-2xl font-bold">{passageComplexity.fleschKincaidGrade}</div>
              <div className="text-xs text-muted-foreground">Grade Level</div>
            </div>
            <div className="p-2 bg-background rounded border">
              <div className="font-bold">{passageComplexity.avgSentenceLength}</div>
              <div className="text-xs text-muted-foreground">Avg Sentence</div>
            </div>
            <div className="p-2 bg-background rounded border">
              <div className="font-bold">{passageComplexity.avgWordLength}</div>
              <div className="text-xs text-muted-foreground">Avg Word</div>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="p-3 bg-primary/10 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {adaptiveScore.explanation}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
