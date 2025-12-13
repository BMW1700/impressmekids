import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, Check } from "lucide-react";
import { useRubricDetail, useRubricScores } from "@/hooks/useRubrics";
import { cn } from "@/lib/utils";

interface RubricGraderProps {
  rubricId: string;
  submissionId: string;
  readOnly?: boolean;
  onScoreChange?: (totalPoints: number, maxPoints: number) => void;
}

export const RubricGrader = ({ rubricId, submissionId, readOnly = false, onScoreChange }: RubricGraderProps) => {
  const { rubric, isLoading: rubricLoading } = useRubricDetail(rubricId);
  const { scores, saveScore } = useRubricScores(submissionId);
  const [localScores, setLocalScores] = useState<Record<string, { levelId: string; points: number; feedback: string }>>({});

  // Initialize local scores from saved scores
  useEffect(() => {
    if (scores.length > 0) {
      const scoreMap: Record<string, { levelId: string; points: number; feedback: string }> = {};
      scores.forEach(score => {
        scoreMap[score.criteria_id] = {
          levelId: score.level_id || '',
          points: score.points_awarded,
          feedback: score.feedback || ''
        };
      });
      setLocalScores(scoreMap);
    }
  }, [scores]);

  // Calculate totals
  useEffect(() => {
    if (rubric && onScoreChange) {
      const totalPoints = Object.values(localScores).reduce((sum, s) => sum + s.points, 0);
      const maxPoints = rubric.criteria?.reduce((sum, c) => sum + c.max_points, 0) || 0;
      onScoreChange(totalPoints, maxPoints);
    }
  }, [localScores, rubric, onScoreChange]);

  const handleLevelSelect = (criteriaId: string, level: any) => {
    if (readOnly) return;

    const newScores = {
      ...localScores,
      [criteriaId]: {
        levelId: level.id,
        points: level.points,
        feedback: localScores[criteriaId]?.feedback || ''
      }
    };
    setLocalScores(newScores);

    saveScore({
      criteriaId,
      levelId: level.id,
      pointsAwarded: level.points,
      feedback: localScores[criteriaId]?.feedback
    });
  };

  const handleFeedbackChange = (criteriaId: string, feedback: string) => {
    if (readOnly) return;

    const currentScore = localScores[criteriaId] || { levelId: '', points: 0, feedback: '' };
    const newScores = {
      ...localScores,
      [criteriaId]: { ...currentScore, feedback }
    };
    setLocalScores(newScores);
  };

  const handleFeedbackBlur = (criteriaId: string) => {
    if (readOnly) return;

    const currentScore = localScores[criteriaId];
    if (currentScore) {
      saveScore({
        criteriaId,
        levelId: currentScore.levelId || undefined,
        pointsAwarded: currentScore.points,
        feedback: currentScore.feedback
      });
    }
  };

  if (rubricLoading) {
    return <div className="text-center py-4 text-muted-foreground">Loading rubric...</div>;
  }

  if (!rubric) {
    return null;
  }

  const totalPoints = Object.values(localScores).reduce((sum, s) => sum + s.points, 0);
  const maxPoints = rubric.criteria?.reduce((sum, c) => sum + c.max_points, 0) || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Grid3X3 className="w-4 h-4" />
            {rubric.title}
          </CardTitle>
          <Badge variant="secondary" className="text-base font-semibold">
            {totalPoints} / {maxPoints} pts
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {rubric.criteria?.map((criteria) => (
          <div key={criteria.id} className="border rounded-lg p-4">
            <div className="mb-3">
              <h4 className="font-medium">{criteria.name}</h4>
              {criteria.description && (
                <p className="text-sm text-muted-foreground">{criteria.description}</p>
              )}
            </div>
            <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: `repeat(${criteria.levels?.length || 4}, 1fr)` }}>
              {criteria.levels?.map((level) => {
                const isSelected = localScores[criteria.id]?.levelId === level.id;
                return (
                  <button
                    key={level.id}
                    onClick={() => handleLevelSelect(criteria.id, level)}
                    disabled={readOnly}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all",
                      isSelected 
                        ? "border-primary bg-primary/10 ring-2 ring-primary" 
                        : "border-border hover:border-primary/50 hover:bg-muted/50",
                      readOnly && "cursor-default"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{level.name}</span>
                      {isSelected && <Check className="w-3 h-3 text-primary" />}
                    </div>
                    <p className="text-sm font-semibold text-primary">{level.points} pts</p>
                    {level.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {level.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Feedback for this criteria</label>
              <Textarea
                value={localScores[criteria.id]?.feedback || ''}
                onChange={(e) => handleFeedbackChange(criteria.id, e.target.value)}
                onBlur={() => handleFeedbackBlur(criteria.id)}
                placeholder="Add specific feedback..."
                rows={2}
                disabled={readOnly}
                className="mt-1 text-sm"
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
