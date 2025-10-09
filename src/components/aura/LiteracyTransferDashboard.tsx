/**
 * Visualization for PATENTABLE ALGORITHM #3: Cross-Modal Literacy Predictor
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRightLeft, TrendingUp, AlertTriangle } from "lucide-react";

interface LiteracyTransferMatrix {
  readingToSpeaking: {
    predictedFluency: number;
    predictedProsody: number;
    predictedConfidence: number;
  };
  correlationStrength: number;
  predictionReasoning: string;
  gapAnalysis: {
    primaryGap: string;
    likelyStrengths: string[];
    potentialWeaknesses: string[];
    targetedExercises: string[];
  };
}

interface LiteracyTransferDashboardProps {
  matrix: LiteracyTransferMatrix;
}

export function LiteracyTransferDashboard({ matrix }: LiteracyTransferDashboardProps) {
  const { readingToSpeaking, correlationStrength, gapAnalysis } = matrix;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          Reading ↔ Speaking Prediction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Correlation Strength */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Correlation Strength</span>
          </div>
          <Badge variant={correlationStrength >= 75 ? "default" : "secondary"}>
            {correlationStrength}%
          </Badge>
        </div>

        {/* Speaking Performance Predictions */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Predicted Speaking Performance
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-background rounded-lg border">
              <div className="text-xl font-bold text-primary">
                {readingToSpeaking.predictedFluency}
              </div>
              <div className="text-xs text-muted-foreground">Fluency</div>
            </div>
            <div className="text-center p-3 bg-background rounded-lg border">
              <div className="text-xl font-bold text-primary">
                {readingToSpeaking.predictedProsody}
              </div>
              <div className="text-xs text-muted-foreground">Prosody</div>
            </div>
            <div className="text-center p-3 bg-background rounded-lg border">
              <div className="text-xl font-bold text-primary">
                {readingToSpeaking.predictedConfidence}
              </div>
              <div className="text-xs text-muted-foreground">Confidence</div>
            </div>
          </div>
        </div>

        {/* Gap Analysis */}
        {gapAnalysis.primaryGap === 'critical' && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              Reading and speaking skills may be diverging. Focus on targeted practice.
            </AlertDescription>
          </Alert>
        )}

        {/* Strengths & Weaknesses */}
        {gapAnalysis.likelyStrengths.length > 0 && (
          <div className="space-y-1">
            <div className="text-sm font-medium text-green-700">Strengths</div>
            <div className="flex flex-wrap gap-1">
              {gapAnalysis.likelyStrengths.map((strength, idx) => (
                <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {gapAnalysis.potentialWeaknesses.length > 0 && (
          <div className="space-y-1">
            <div className="text-sm font-medium text-amber-700">Areas for Growth</div>
            <div className="flex flex-wrap gap-1">
              {gapAnalysis.potentialWeaknesses.map((weakness, idx) => (
                <Badge key={idx} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {weakness}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Targeted Exercises */}
        {gapAnalysis.targetedExercises.length > 0 && (
          <div className="pt-2 border-t space-y-2">
            <div className="text-sm font-medium">Recommended Exercises</div>
            <ul className="text-sm text-muted-foreground space-y-1">
              {gapAnalysis.targetedExercises.map((exercise, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{exercise}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
