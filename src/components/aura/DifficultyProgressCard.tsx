import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, Target, Zap, Info } from "lucide-react";
import { DIFFICULTY_LEVELS } from "@/lib/difficultyScaling";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DifficultyProgressCardProps {
  currentLevel: number;
  performanceTrend: number;
  recentGrades: number[];
  difficultyHistory?: Array<{ timestamp: string; level: number; performance: number }>;
}

const DifficultyProgressCard = ({
  currentLevel,
  performanceTrend,
  recentGrades,
  difficultyHistory = [],
}: DifficultyProgressCardProps) => {
  const currentDifficulty = DIFFICULTY_LEVELS.find(d => d.level === currentLevel) || DIFFICULTY_LEVELS[0];
  const nextDifficulty = DIFFICULTY_LEVELS.find(d => d.level === currentLevel + 1);
  
  const avgGrade = recentGrades.length > 0
    ? Math.round(recentGrades.reduce((a, b) => a + b, 0) / recentGrades.length)
    : 0;

  const progressToNext = Math.min(100, Math.max(0, (avgGrade - 60) * 2)); // 60-100 grade = 0-80% progress

  const getTrendIcon = () => {
    if (performanceTrend > 5) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (performanceTrend < -5) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-amber-600" />;
  };

  const getTrendLabel = () => {
    if (performanceTrend > 5) return 'Improving';
    if (performanceTrend < -5) return 'Needs Focus';
    return 'Stable';
  };

  const getDifficultyColor = (level: number) => {
    const colors = {
      1: 'bg-green-500',
      2: 'bg-blue-500',
      3: 'bg-purple-500',
      4: 'bg-orange-500',
      5: 'bg-red-500',
    };
    return colors[level as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <Card className="overflow-hidden border-2 border-primary/20">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Difficulty Level
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          Your difficulty level adapts based on your performance. As you improve,
                          exercises become more challenging to accelerate your learning.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription>Adaptive challenge system</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className="text-sm font-medium">{getTrendLabel()}</span>
            </div>
          </div>
        </CardHeader>
      </div>

      <CardContent className="space-y-6 pt-6">
        {/* Current Level Display */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge 
                  variant="default" 
                  className={`${getDifficultyColor(currentLevel)} text-white text-lg px-3 py-1`}
                >
                  Level {currentLevel}
                </Badge>
                <span className="font-semibold text-xl">{currentDifficulty.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">{currentDifficulty.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{avgGrade}</div>
              <div className="text-xs text-muted-foreground">Avg Score</div>
            </div>
          </div>

          {/* Requirements */}
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs font-medium mb-2">Skills at This Level:</p>
            <div className="flex flex-wrap gap-1.5">
              {currentDifficulty.requirements.map((req, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {req}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Progress to Next Level */}
        {nextDifficulty && currentLevel < 5 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="font-medium">Progress to {nextDifficulty.label}</span>
              </div>
              <span className="text-muted-foreground">{Math.round(progressToNext)}%</span>
            </div>
            <Progress value={progressToNext} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Keep scoring above 85 to advance! {progressToNext >= 80 && '🎉 Almost there!'}
            </p>
          </div>
        )}

        {/* Recent Performance */}
        {recentGrades.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Recent Sessions ({recentGrades.length})</p>
            <div className="flex gap-2">
              {recentGrades.slice(0, 5).map((grade, idx) => (
                <div
                  key={idx}
                  className="flex-1 rounded overflow-hidden bg-muted"
                  style={{ height: '60px', position: 'relative' }}
                >
                  <div
                    className={`absolute bottom-0 w-full transition-all ${
                      grade >= 85 ? 'bg-green-500' :
                      grade >= 70 ? 'bg-blue-500' :
                      grade >= 60 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ height: `${grade}%` }}
                  />
                  <div className="absolute inset-0 flex items-end justify-center pb-1">
                    <span className="text-xs font-semibold text-white drop-shadow">
                      {grade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty History */}
        {difficultyHistory.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Difficulty Journey:</p>
            <div className="flex items-center gap-1">
              {difficultyHistory.slice(-8).map((entry, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${getDifficultyColor(entry.level)}`}
                  >
                    {entry.level}
                  </div>
                  {idx < difficultyHistory.length - 1 && (
                    <div className="text-xs text-muted-foreground">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="pt-2">
          <Button className="w-full" size="sm" variant="outline">
            <Zap className="w-4 h-4 mr-2" />
            Continue Practicing at Level {currentLevel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DifficultyProgressCard;