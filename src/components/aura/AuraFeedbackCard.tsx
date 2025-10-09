import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";

interface AuraFeedbackCardProps {
  analysis: {
    grade: number;
    wpm: number;
    pronunciation: number;
    clarity: number;
    confidence: number;
    feedback: string[];
    pronunciationFlags?: string[];
    suggestedExercises?: Array<{ title: string; description: string; difficulty: string }>;
  };
}

const AuraFeedbackCard = ({ analysis }: AuraFeedbackCardProps) => {
  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-green-600";
    if (grade >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 3) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Analysis Results</CardTitle>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getGradeColor(analysis.grade)}`}>
              {analysis.grade}
            </div>
            <div className="text-sm text-muted-foreground">Overall Score</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Words/Min</div>
            <div className="text-2xl font-bold">{Math.round(analysis.wpm)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Pronunciation</div>
            <Badge variant="outline" className={getScoreColor(analysis.pronunciation)}>
              {analysis.pronunciation}/5
            </Badge>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Clarity</div>
            <Badge variant="outline" className={getScoreColor(analysis.clarity)}>
              {analysis.clarity}/5
            </Badge>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Confidence</div>
            <Badge variant="outline" className={getScoreColor(analysis.confidence)}>
              {analysis.confidence}/5
            </Badge>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Pronunciation</span>
              <span className="text-muted-foreground">{(analysis.pronunciation / 5 * 100).toFixed(0)}%</span>
            </div>
            <Progress value={analysis.pronunciation / 5 * 100} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Clarity</span>
              <span className="text-muted-foreground">{(analysis.clarity / 5 * 100).toFixed(0)}%</span>
            </div>
            <Progress value={analysis.clarity / 5 * 100} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Confidence</span>
              <span className="text-muted-foreground">{(analysis.confidence / 5 * 100).toFixed(0)}%</span>
            </div>
            <Progress value={analysis.confidence / 5 * 100} className="h-2" />
          </div>
        </div>

        {/* Feedback Messages */}
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Key Feedback
          </h4>
          {analysis.feedback.map((message, idx) => (
            <div key={idx} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm">{message}</p>
            </div>
          ))}
        </div>

        {/* Pronunciation Flags */}
        {analysis.pronunciationFlags && analysis.pronunciationFlags.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Areas to Practice
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.pronunciationFlags.map((flag, idx) => (
                <Badge key={idx} variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                  {flag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuraFeedbackCard;
