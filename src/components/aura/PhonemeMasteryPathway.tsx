import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Target, TrendingUp, Sparkles, Info } from "lucide-react";
import { predictPhonemeGains, TransferPrediction } from "@/lib/phonemeTransferModel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PhonemeMasteryPathwayProps {
  masteredPhonemes: string[];
  strugglingPhonemes: string[];
  studentGrade?: number;
}

const PhonemeMasteryPathway = ({ 
  masteredPhonemes, 
  strugglingPhonemes, 
  studentGrade = 5 
}: PhonemeMasteryPathwayProps) => {
  const predictions = predictPhonemeGains(masteredPhonemes, strugglingPhonemes, studentGrade);
  const topPredictions = predictions.filter(p => p.readinessLevel === 'high' || p.readinessLevel === 'medium').slice(0, 5);
  
  const totalPhonemes = masteredPhonemes.length + strugglingPhonemes.length + 10; // Approximate total
  const masteryPercentage = Math.round((masteredPhonemes.length / totalPhonemes) * 100);

  const getReadinessBadgeVariant = (level: string) => {
    switch (level) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getReadinessLabel = (level: string) => {
    switch (level) {
      case 'high': return 'Ready Now';
      case 'medium': return 'Soon';
      default: return 'Later';
    }
  };

  return (
    <Card className="overflow-hidden border-2 border-primary/20">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                🎯 Your Phoneme Mastery Pathway
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        Our AI predicts which sounds you'll master next based on articulatory similarity. 
                        Sounds similar to ones you've mastered are easier to learn!
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>
                AI-powered predictions based on speech patterns
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </div>

      <CardContent className="space-y-6 pt-6">
        {/* Current Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">{masteryPercentage}%</span>
          </div>
          <Progress value={masteryPercentage} className="h-2" />
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="font-medium">{masteredPhonemes.length}</span>
              <span className="text-muted-foreground">Mastered</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span className="font-medium">{strugglingPhonemes.length}</span>
              <span className="text-muted-foreground">Working On</span>
            </div>
          </div>
        </div>

        {/* Mastered Phonemes */}
        {masteredPhonemes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>Mastered Sounds</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {masteredPhonemes.slice(0, 12).map((phoneme) => (
                <Badge key={phoneme} variant="outline" className="border-green-600/30 bg-green-50 text-green-700">
                  /{phoneme}/
                </Badge>
              ))}
              {masteredPhonemes.length > 12 && (
                <Badge variant="outline" className="border-green-600/30 bg-green-50 text-green-700">
                  +{masteredPhonemes.length - 12} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Working On Phonemes */}
        {strugglingPhonemes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>Working On</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {strugglingPhonemes.map((phoneme) => (
                <Badge key={phoneme} variant="outline" className="border-amber-600/30 bg-amber-50 text-amber-700">
                  /{phoneme}/
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Transfer Learning Predictions */}
        {topPredictions.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">🚀 Ready to Master Next</span>
            </div>

            <div className="space-y-2">
              {topPredictions.map((prediction: TransferPrediction) => (
                <div 
                  key={prediction.phoneme}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">/{prediction.phoneme}/</span>
                        <Badge variant={getReadinessBadgeVariant(prediction.readinessLevel)}>
                          {getReadinessLabel(prediction.readinessLevel)}
                        </Badge>
                        <span className="text-sm font-medium text-muted-foreground">
                          {prediction.transferProbability}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {prediction.reasoning}
                      </p>
                      {prediction.similarToMastered.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-xs text-muted-foreground">Similar to:</span>
                          {prediction.similarToMastered.map(p => (
                            <Badge key={p} variant="outline" className="text-xs">
                              /{p}/
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Complete more practice sessions to see predictions</p>
          </div>
        )}

        {/* Call to Action */}
        {topPredictions.length > 0 && (
          <div className="pt-2">
            <Button className="w-full" size="sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Practice Exercises
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhonemeMasteryPathway;